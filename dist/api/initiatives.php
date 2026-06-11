<?php
session_start();
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents('php://input'), true);

// Helper: Compress logo avatar image
function compressLogo($sourcePath, $maxWidth = 300, $quality = 80) {
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
            return;
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
    
    imagejpeg($image, $sourcePath, $quality);
    imagedestroy($image);
}

// Helper: Save Base64 logo to disk
function saveBase64Logo($base64Str) {
    if (strpos($base64Str, 'data:image') === 0) {
        list($type, $data) = explode(';', $base64Str);
        list(, $data)      = explode(',', $data);
        $data = base64_decode($data);
        
        $uploadDir = __DIR__ . '/../../uploads';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $filename = 'logo_' . uniqid() . '.jpg';
        $filepath = $uploadDir . '/' . $filename;
        
        file_put_contents($filepath, $data);
        compressLogo($filepath, 300, 80);
        
        return '/uploads/' . $filename;
    }
    return $base64Str;
}

// --- GET REQUEST (PUBLIC DIRECTORY LISTING) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Select active initiatives and count their active events
    $query = "SELECT i.id, i.name, i.email, i.description, i.logo, i.website, i.instagram, i.facebook, 
                     COUNT(e.id) as events_count 
              FROM initiatives i 
              LEFT JOIN events e ON i.id = e.initiative_id AND e.status != 'deleted'
              WHERE i.status = 'active' 
              GROUP BY i.id 
              ORDER BY i.name ASC";
              
    $stmt = $db->query($query);
    $initiatives = $stmt->fetchAll();
    
    echo json_encode($initiatives);
    exit;
}

// --- POST REQUEST (REQUIRES AUTHENTICATED SESSION) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['initiative_id'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "unauthorized"]);
        exit;
    }

    $initiativeId = $_SESSION['initiative_id'];
    $action = isset($data['action']) ? $data['action'] : '';

    if ($action === 'update_profile') {
        $name = isset($data['name']) ? trim($data['name']) : '';
        $description = isset($data['description']) ? trim($data['description']) : '';
        $logoBase64 = isset($data['logo']) ? $data['logo'] : '';
        $website = isset($data['website']) ? trim($data['website']) : '';
        $instagram = isset($data['instagram']) ? trim($data['instagram']) : '';
        $facebook = isset($data['facebook']) ? trim($data['facebook']) : '';

        if (empty($name) || empty($description)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "missing_fields"]);
            exit;
        }

        // Process logo image
        $logoPath = saveBase64Logo($logoBase64);

        // Update database
        $stmt = $db->prepare("UPDATE initiatives 
            SET name = :name, description = :description, logo = :logo, 
                website = :website, instagram = :instagram, facebook = :facebook 
            WHERE id = :id");
            
        $stmt->execute([
            'name' => $name,
            'description' => $description,
            'logo' => $logoPath,
            'website' => $website,
            'instagram' => $instagram,
            'facebook' => $facebook,
            'id' => $initiativeId
        ]);

        // Update session name cache
        $_SESSION['initiative_name'] = $name;

        echo json_encode(["success" => true]);
        exit;
    }
}
?>
