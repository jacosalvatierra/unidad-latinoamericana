<?php
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "method_not_allowed"]);
    exit;
}

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

$name = isset($data['name']) ? trim($data['name']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';
$description = isset($data['description']) ? trim($data['description']) : '';
$logoRaw = isset($data['logo']) ? $data['logo'] : '';
$website = isset($data['website']) ? trim($data['website']) : '';
$instagram = isset($data['instagram']) ? trim($data['instagram']) : '';
$facebook = isset($data['facebook']) ? trim($data['facebook']) : '';

$logo = saveBase64Logo($logoRaw);


if (empty($name) || empty($email) || empty($password) || empty($description)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "missing_fields"]);
    exit;
}

try {
    // Check if email already exists
    $stmt = $db->prepare("SELECT id FROM initiatives WHERE email = :email");
    $stmt->execute(['email' => $email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "error" => "email_exists"]);
        exit;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert initiative as pending
    $stmt = $db->prepare("INSERT INTO initiatives (name, email, password, description, logo, website, instagram, facebook, status) 
        VALUES (:name, :email, :password, :description, :logo, :website, :instagram, :facebook, 'pending')");
    
    $stmt->execute([
        'name' => $name,
        'email' => $email,
        'password' => $hashedPassword,
        'description' => $description,
        'logo' => $logo,
        'website' => $website,
        'instagram' => $instagram,
        'facebook' => $facebook
    ]);

    $newId = $db->lastInsertId();

    // Generate secure approval token
    $token = hash_hmac('sha256', $newId, APPROVAL_SECRET);
    $approveUrl = SITE_URL . "/api/approve.php?id=" . $newId . "&token=" . $token;

    // Send email to Administrator
    $to = ADMIN_EMAIL;
    $subject = "=?UTF-8?B?" . base64_encode("Unidad Latinoamericana: Nueva iniciativa pendiente - " . $name) . "?=";
    
    // HTML Email body for beautiful representation in Jaco's inbox
    $message = "
    <html>
    <head>
        <title>Nueva Iniciativa Registrada</title>
        <style>
            body { font-family: sans-serif; line-height: 1.5; color: #2B2927; background-color: #FAF8F5; }
            .card { background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e6e2dc; max-width: 600px; margin: 20px auto; }
            h2 { color: #523663; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #2C5E43; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 16px; }
            .details { background-color: #f9f6ee; padding: 16px; border-radius: 4px; margin-top: 16px; border-left: 4px solid #C84B31; }
        </style>
    </head>
    <body>
        <div class='card'>
            <h2>¡Nueva iniciativa registrada!</h2>
            <p>Hola Jaco,</p>
            <p>Se ha registrado un nuevo creador de eventos en <strong>Unidad Latinoamericana</strong>. A continuación, tienes los detalles del registro:</p>
            
            <div class='details'>
                <strong>Nombre:</strong> {$name}<br>
                <strong>Email:</strong> {$email}<br>
                <strong>Descripción:</strong> {$description}<br>
                <strong>Sitio Web:</strong> " . ($website ?: 'No especificado') . "<br>
                <strong>Instagram:</strong> " . ($instagram ?: 'No especificado') . "<br>
                <strong>Facebook:</strong> " . ($facebook ?: 'No especificado') . "
            </div>

            <p>Si deseas aprobar esta iniciativa para que pueda comenzar a publicar sus eventos y acceder al calendario de miembros, haz clic en el siguiente botón:</p>
            <a href='{$approveUrl}' class='btn'>Aprobar Iniciativa</a>
            
            <p style='font-size: 0.8rem; color: #6E6A64; margin-top: 24px;'>Si el botón no funciona, copia y pega este enlace en tu navegador:<br>{$approveUrl}</p>
        </div>
    </body>
    </html>
    ";

    // Set correct headers for UTF-8 and HTML mail
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Unidad Latinoamericana <no-reply@unidad-latinoamericana.com>" . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";

    // Send the mail
    mail($to, $subject, $message, $headers);

    echo json_encode(["success" => true, "message" => "registered_pending"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
}
?>
