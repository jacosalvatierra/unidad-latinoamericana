<?php
session_start();
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($data['action']) ? $data['action'] : '';

    if ($action === 'login') {
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "missing_fields"]);
            exit;
        }

        // Query initiative
        $stmt = $db->prepare("SELECT * FROM initiatives WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if ($user) {
            // Check password
            if (password_verify($password, $user['password'])) {
                // Check status
                if ($user['status'] === 'active') {
                    // Set session variables
                    $_SESSION['initiative_id'] = $user['id'];
                    $_SESSION['initiative_name'] = $user['name'];
                    $_SESSION['initiative_email'] = $user['email'];

                    // Return user data (omit password)
                    unset($user['password']);
                    echo json_encode([
                        "success" => true, 
                        "user" => $user
                    ]);
                    exit;
                } else {
                    http_response_code(403);
                    echo json_encode(["success" => false, "error" => "pending_approval"]);
                    exit;
                }
            }
        }

        http_response_code(401);
        echo json_encode(["success" => false, "error" => "invalid_credentials"]);
        exit;
    } 
    
    else if ($action === 'logout') {
        // Clear session
        $_SESSION = array();
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        echo json_encode(["success" => true]);
        exit;
    }
}

// GET request: check session state
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_SESSION['initiative_id'])) {
        $stmt = $db->prepare("SELECT id, name, email, description, logo, website, instagram, facebook, status FROM initiatives WHERE id = :id");
        $stmt->execute(['id' => $_SESSION['initiative_id']]);
        $user = $stmt->fetch();
        if ($user && $user['status'] === 'active') {
            echo json_encode(["logged_in" => true, "user" => $user]);
            exit;
        }
    }
    echo json_encode(["logged_in" => false]);
    exit;
}
?>
