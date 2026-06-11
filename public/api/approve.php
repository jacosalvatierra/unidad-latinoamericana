<?php
require_once __DIR__ . '/db.php';

// This script responds with HTML as it is opened directly by the Admin clicking the email link
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aprobación de Iniciativa</title>
    <style>
        body {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #FAF8F5;
            color: #2B2927;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
        }
        .result-card {
            background-color: #FFFFFF;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(43, 41, 39, 0.08);
            border: 1px solid rgba(110, 106, 100, 0.12);
            padding: 40px;
            max-width: 450px;
            width: 100%;
            text-align: center;
        }
        .icon {
            font-size: 3.5rem;
            margin-bottom: 20px;
            display: block;
        }
        h1 {
            font-size: 1.8rem;
            color: #523663;
            margin: 0 0 12px 0;
        }
        p {
            color: #6E6A64;
            line-height: 1.5;
            margin: 0 0 24px 0;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2C5E43;
            color: #FAF8F5;
            text-decoration: none;
            font-weight: 600;
            border-radius: 8px;
            transition: all 0.2s ease;
        }
        .btn:hover {
            background-color: #204531;
            transform: translateY(-1px);
        }
        .error-card h1 {
            color: #C84B31;
        }
        .error-card .btn {
            background-color: #C84B31;
        }
        .error-card .btn:hover {
            background-color: #aa3d27;
        }
    </style>
</head>
<body>

<?php
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$token = isset($_GET['token']) ? $_GET['token'] : '';

if ($id <= 0 || empty($token)) {
    showErrorCard("Solicitud Inválida", "Faltan parámetros requeridos para completar la aprobación.");
    exit;
}

// Verify token
$expectedToken = hash_hmac('sha256', $id, APPROVAL_SECRET);

if (!hash_equals($expectedToken, $token)) {
    showErrorCard("Firma Inválida", "El token de seguridad es incorrecto o ha expirado. Por seguridad, no se puede aprobar.");
    exit;
}

try {
    // Check current status
    $stmt = $db->prepare("SELECT name, email, status FROM initiatives WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $initiative = $stmt->fetch();

    if (!$initiative) {
        showErrorCard("Iniciativa No Encontrada", "La iniciativa seleccionada no existe en la base de datos.");
        exit;
    }

    if ($initiative['status'] === 'active') {
        showSuccessCard("Ya Aprobada", "La iniciativa <strong>" . htmlspecialchars($initiative['name']) . "</strong> ya se encontraba activa anteriormente.", false);
        exit;
    }

    // Activate initiative
    $stmt = $db->prepare("UPDATE initiatives SET status = 'active' WHERE id = :id");
    $stmt->execute(['id' => $id]);

    // Send Welcome Email to Creator
    $to = $initiative['email'];
    $subject = "=?UTF-8?B?" . base64_encode("¡Tu cuenta en Unidad Latinoamericana ha sido aprobada!") . "?=";
    
    $message = "
    <html>
    <head>
        <title>Cuenta Aprobada</title>
        <style>
            body { font-family: sans-serif; line-height: 1.5; color: #2B2927; background-color: #FAF8F5; }
            .card { background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e6e2dc; max-width: 600px; margin: 20px auto; }
            h2 { color: #2C5E43; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #523663; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 16px; }
            .footer { font-size: 0.8rem; color: #6E6A64; margin-top: 24px; border-top: 1px solid #e6e2dc; padding-top: 16px; }
        </style>
    </head>
    <body>
        <div class='card'>
            <h2>¡Tu cuenta ha sido aprobada! 🎉</h2>
            <p>Hola <strong>" . htmlspecialchars($initiative['name']) . "</strong>,</p>
            <p>Nos complace informarte que tu solicitud de registro ha sido verificada y aprobada por el administrador.</p>
            <p>Ya puedes iniciar sesión en la web, actualizar los datos de tu perfil y comenzar a subir tus próximos eventos y flyers para que toda la comunidad se entere.</p>
            
            <a href='" . SITE_URL . "/#login' class='btn'>Iniciar Sesión en el Portal</a>
            
            <div class='footer'>
                Atentamente,<br>
                <strong>Equipo Unidad Latinoamericana</strong><br>
                <a href='" . SITE_URL . "'>" . SITE_URL . "</a>
            </div>
        </div>
    </body>
    </html>
    ";

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Unidad Latinoamericana <no-reply@unidad-latinoamericana.com>" . "\r\n";

    mail($to, $subject, $message, $headers);

    showSuccessCard("Aprobación Exitosa", "La iniciativa <strong>" . htmlspecialchars($initiative['name']) . "</strong> ha sido aprobada con éxito. Se ha enviado un correo electrónico de bienvenida automático a <strong>" . htmlspecialchars($initiative['email']) . "</strong>.");

} catch (PDOException $e) {
    showErrorCard("Error de Base de Datos", "Ocurrió un error en el servidor al intentar actualizar los registros: " . $e->getMessage());
}

// Card Renderer Helpers
function showSuccessCard($title, $msg, $sendEmail = true) {
    ?>
    <div class="result-card">
        <span class="icon">✅</span>
        <h1><?php echo $title; ?></h1>
        <p><?php echo $msg; ?></p>
        <a href="<?php echo SITE_URL; ?>" class="btn">Ir al Portal Web</a>
    </div>
    <?php
}

function showErrorCard($title, $msg) {
    ?>
    <div class="result-card error-card">
        <span class="icon">❌</span>
        <h1><?php echo $title; ?></h1>
        <p><?php echo $msg; ?></p>
        <a href="<?php echo SITE_URL; ?>" class="btn">Volver al Portal</a>
    </div>
    <?php
}
?>

</body>
</html>
