<?php
session_start();
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents('php://input'), true);

// Helper: Image compression and resizing using PHP GD
function compressImage($sourcePath, $maxWidth = 800, $quality = 75) {
    $info = getimagesize($sourcePath);
    if ($info === false) return;
    
    $mime = $info['mime'];
    switch ($mime) {
        case 'image/jpeg':
        case 'image/jpg':
            $image = imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $image = imagecreatefrompng($sourcePath);
            // Convert PNG transparency to white background for JPEG conversion
            $bg = imagecreatetruecolor(imagesx($image), imagesy($image));
            $white = imagecolorallocate($bg, 255, 255, 255);
            imagefill($bg, 0, 0, $white);
            imagecopy($bg, $image, 0, 0, 0, 0, imagesx($image), imagesy($image));
            imagedestroy($image);
            $image = $bg;
            break;
        case 'image/gif':
            $image = imagecreatefromgif($sourcePath);
            break;
        case 'image/webp':
            $image = @imagecreatefromwebp($sourcePath);
            break;
        default:
            return; // Format not supported
    }

    if (!$image) return;

    list($width, $height) = $info;
    if ($width > $maxWidth) {
        $ratio = $height / $width;
        $newWidth = $maxWidth;
        $newHeight = round($maxWidth * $ratio);
        
        $newImg = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($newImg, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($image);
        $image = $newImg;
    }
    
    // Save as JPEG compressed to save SiteGround space and speed up load times
    imagejpeg($image, $sourcePath, $quality);
    imagedestroy($image);
}

// Helper: Parse Base64 and save to disk
function saveBase64Image($base64Str) {
    if (strpos($base64Str, 'data:image') === 0) {
        // Split header and data
        list($type, $data) = explode(';', $base64Str);
        list(, $data)      = explode(',', $data);
        $data = base64_decode($data);
        
        // Target uploads folder (placed in the root of the project, next to index.html/api)
        $uploadDir = __DIR__ . '/../../uploads';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate a clean, randomized filename
        $filename = 'flyer_' . uniqid() . '.jpg';
        $filepath = $uploadDir . '/' . $filename;
        
        // Write base64 bytes to file
        file_put_contents($filepath, $data);
        
        // Compress and optimize
        compressImage($filepath, 800, 75);
        
        return '/uploads/' . $filename;
    }
    return $base64Str; // Already a URL or absolute path
}

// Helper: Notify all newsletter subscribers
function sendNewsletterEmail($subject, $htmlContent) {
    global $db;
    try {
        $stmt = $db->query("SELECT email FROM subscribers");
        $emails = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (empty($emails)) return;

        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: Unidad Latinoamericana <no-reply@unidad-latinoamericana.com>" . "\r\n";
        
        // Send individually to protect privacy (BCC or loop, loop is simpler and safe for small/medium audiences)
        foreach ($emails as $email) {
            mail($email, $subject, $htmlContent, $headers);
        }
    } catch (Exception $e) {
        error_log("Failed to send newsletter emails: " . $e->getMessage());
    }
}

// --- GET REQUEST ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if the request comes from an authenticated session
    $loggedIn = isset($_SESSION['initiative_id']);
    
    // Select active events and join with initiative info
    $query = "SELECT e.*, i.name as initiative_name, i.logo as initiative_logo 
              FROM events e 
              JOIN initiatives i ON e.initiative_id = i.id 
              WHERE e.status != 'deleted'";
              
    // If not logged in, filter out members-only events
    if (!$loggedIn) {
        $query .= " AND e.visibility != 'members'";
    }
    
    // Order by date ascending
    $query .= " ORDER BY e.date ASC, e.time ASC";
    
    $stmt = $db->query($query);
    $events = $stmt->fetchAll();
    
    echo json_encode($events);
    exit;
}

// --- POST REQUEST (REQUIRES AUTHENTICATION) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['initiative_id'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "unauthorized"]);
        exit;
    }

    $initiativeId = $_SESSION['initiative_id'];
    $action = isset($data['action']) ? $data['action'] : '';

    if ($action === 'create') {
        $title = isset($data['title']) ? trim($data['title']) : '';
        $date = isset($data['date']) ? $data['date'] : '';
        $time = isset($data['time']) ? $data['time'] : '';
        $category = isset($data['category']) ? $data['category'] : 'other';
        $location = isset($data['location']) ? trim($data['location']) : '';
        $description = isset($data['description']) ? trim($data['description']) : '';
        $flyerBase64 = isset($data['flyer']) ? $data['flyer'] : '';
        $visibility = isset($data['visibility']) ? $data['visibility'] : 'public';
        $needsHelp = isset($data['needs_help']) && $data['needs_help'] ? 1 : 0;

        if (empty($title) || empty($date) || empty($time) || empty($location) || empty($description)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "missing_fields"]);
            exit;
        }

        // Process and save flyer
        $flyerPath = saveBase64Image($flyerBase64);

        // Insert into database
        $stmt = $db->prepare("INSERT INTO events (initiative_id, title, date, time, category, location, description, flyer, visibility, needs_help, status) 
            VALUES (:initiative_id, :title, :date, :time, :category, :location, :description, :flyer, :visibility, :needs_help, 'active')");
        
        $stmt->execute([
            'initiative_id' => $initiativeId,
            'title' => $title,
            'date' => $date,
            'time' => $time,
            'category' => $category,
            'location' => $location,
            'description' => $description,
            'flyer' => $flyerPath,
            'visibility' => $visibility,
            'needs_help' => $needsHelp
        ]);

        $eventId = $db->lastInsertId();

        // Send newsletter notification to subscribers (only if event is PUBLIC)
        if ($visibility === 'public') {
            $formattedDate = date("d/m/Y", strtotime($date));
            $subject = "=?UTF-8?B?" . base64_encode("🌎 Unidad Latinoamericana: ¡Nuevo Evento Confirmado!") . "?=";
            
            $html = "
            <html>
            <head>
                <style>
                    body { font-family: sans-serif; line-height: 1.5; color: #2B2927; background-color: #FAF8F5; }
                    .card { background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e6e2dc; max-width: 600px; margin: 20px auto; }
                    h2 { color: #523663; }
                    .btn { display: inline-block; padding: 12px 24px; background-color: #2C5E43; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 16px; }
                    .meta { color: #C84B31; font-weight: bold; font-size: 1.1rem; }
                </style>
            </head>
            <body>
                <div class='card'>
                    <h2>¡Nuevo evento confirmado! 📣</h2>
                    <p>La iniciativa <strong>" . htmlspecialchars($_SESSION['initiative_name']) . "</strong> ha publicado un nuevo evento en el portal:</p>
                    
                    <p style='font-size: 1.3rem; font-weight: bold; color: #523663; margin-bottom: 8px;'>{$title}</p>
                    <p class='meta'>📅 {$formattedDate} a las {$time} hs</p>
                    <p>📍 <strong>Lugar:</strong> {$location}</p>
                    
                    <p style='color: #6E6A64;'>" . nl2br(htmlspecialchars(substr($description, 0, 200))) . "...</p>
                    
                    <a href='" . SITE_URL . "/?event={$eventId}' class='btn'>Ver Detalles y Flyer</a>
                </div>
            </body>
            </html>
            ";
            
            sendNewsletterEmail($subject, $html);
        }

        echo json_encode(["success" => true, "id" => $eventId]);
        exit;
    }

    else if ($action === 'edit') {
        $id = isset($data['id']) ? intval($data['id']) : 0;
        $title = isset($data['title']) ? trim($data['title']) : '';
        $date = isset($data['date']) ? $data['date'] : '';
        $time = isset($data['time']) ? $data['time'] : '';
        $category = isset($data['category']) ? $data['category'] : 'other';
        $location = isset($data['location']) ? trim($data['location']) : '';
        $description = isset($data['description']) ? trim($data['description']) : '';
        $flyerBase64 = isset($data['flyer']) ? $data['flyer'] : '';
        $visibility = isset($data['visibility']) ? $data['visibility'] : 'public';
        $needsHelp = isset($data['needs_help']) && $data['needs_help'] ? 1 : 0;

        if ($id <= 0 || empty($title) || empty($date) || empty($time) || empty($location) || empty($description)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "missing_fields"]);
            exit;
        }

        // Verify ownership
        $stmt = $db->prepare("SELECT initiative_id FROM events WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $event = $stmt->fetch();

        if (!$event || $event['initiative_id'] != $initiativeId) {
            http_response_code(403);
            echo json_encode(["success" => false, "error" => "unauthorized"]);
            exit;
        }

        // Process flyer if new image is uploaded (contains base64 tag)
        $flyerPath = saveBase64Image($flyerBase64);

        // Update database
        $stmt = $db->prepare("UPDATE events 
            SET title = :title, date = :date, time = :time, category = :category, 
                location = :location, description = :description, flyer = :flyer, 
                visibility = :visibility, needs_help = :needs_help 
            WHERE id = :id");
        
        $stmt->execute([
            'title' => $title,
            'date' => $date,
            'time' => $time,
            'category' => $category,
            'location' => $location,
            'description' => $description,
            'flyer' => $flyerPath,
            'visibility' => $visibility,
            'needs_help' => $needsHelp,
            'id' => $id
        ]);

        echo json_encode(["success" => true]);
        exit;
    }

    else if ($action === 'cancel') {
        $id = isset($data['id']) ? intval($data['id']) : 0;

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "invalid_id"]);
            exit;
        }

        // Verify ownership
        $stmt = $db->prepare("SELECT title, initiative_id, date, visibility FROM events WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $event = $stmt->fetch();

        if (!$event || $event['initiative_id'] != $initiativeId) {
            http_response_code(403);
            echo json_encode(["success" => false, "error" => "unauthorized"]);
            exit;
        }

        // Mark as cancelled in database
        $stmt = $db->prepare("UPDATE events SET status = 'cancelled' WHERE id = :id");
        $stmt->execute(['id' => $id]);

        // Send newsletter cancellation notification if event was PUBLIC
        if ($event['visibility'] === 'public') {
            $formattedDate = date("d/m/Y", strtotime($event['date']));
            $subject = "=?UTF-8?B?" . base64_encode("⚠️ Unidad Latinoamericana: Evento Cancelado - " . $event['title']) . "?=";
            
            $html = "
            <html>
            <head>
                <style>
                    body { font-family: sans-serif; line-height: 1.5; color: #2B2927; background-color: #FAF8F5; }
                    .card { background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e6e2dc; max-width: 600px; margin: 20px auto; border-top: 5px solid #C84B31; }
                    h2 { color: #C84B31; }
                </style>
            </head>
            <body>
                <div class='card'>
                    <h2>Aviso de Evento Cancelado ⚠️</h2>
                    <p>Lamentamos informarte que el siguiente evento programado por <strong>" . htmlspecialchars($_SESSION['initiative_name']) . "</strong> ha sido cancelado:</p>
                    
                    <p style='font-size: 1.3rem; font-weight: bold; text-decoration: line-through; color: #6E6A64; margin-bottom: 8px;'>{$event['title']}</p>
                    <p><strong>Fecha programada:</strong> {$formattedDate}</p>
                    
                    <p>Por favor, comparte esta información con quienes planeaban asistir para evitar traslados innecesarios.</p>
                    <a href='" . SITE_URL . "' style='color: #2C5E43; font-weight: bold; text-decoration: none;'>Ir al Portal &rarr;</a>
                </div>
            </body>
            </html>
            ";
            
            sendNewsletterEmail($subject, $html);
        }

        echo json_encode(["success" => true]);
        exit;
    }

    else if ($action === 'delete') {
        $id = isset($data['id']) ? intval($data['id']) : 0;

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "invalid_id"]);
            exit;
        }

        // Verify ownership
        $stmt = $db->prepare("SELECT initiative_id FROM events WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $event = $stmt->fetch();

        if (!$event || $event['initiative_id'] != $initiativeId) {
            http_response_code(403);
            echo json_encode(["success" => false, "error" => "unauthorized"]);
            exit;
        }

        // Soft delete the event (status = 'deleted')
        $stmt = $db->prepare("UPDATE events SET status = 'deleted' WHERE id = :id");
        $stmt->execute(['id' => $id]);

        echo json_encode(["success" => true]);
        exit;
    }
}
?>
