<?php
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "method_not_allowed"]);
    exit;
}

$email = isset($data['email']) ? trim($data['email']) : '';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "invalid_email"]);
    exit;
}

try {
    // 1. Save locally in SQLite Database
    $stmt = $db->prepare("SELECT id FROM subscribers WHERE email = :email");
    $stmt->execute(['email' => $email]);
    
    if (!$stmt->fetch()) {
        $stmt = $db->prepare("INSERT INTO subscribers (email) VALUES (:email)");
        $stmt->execute(['email' => $email]);
    }

    // 2. Add to Mailchimp if credentials are provided in config.php
    if (defined('MAILCHIMP_API_KEY') && MAILCHIMP_API_KEY !== '' && 
        defined('MAILCHIMP_LIST_ID') && MAILCHIMP_LIST_ID !== '') {
        
        $apiKey = MAILCHIMP_API_KEY;
        $listId = MAILCHIMP_LIST_ID;
        
        // Extract datacenter from API Key (e.g. keyname-us14 -> us14)
        $parts = explode('-', $apiKey);
        $dc = isset($parts[1]) ? $parts[1] : 'us1';
        
        $url = "https://{$dc}.api.mailchimp.com/3.0/lists/{$listId}/members/";
        
        $payload = json_encode([
            "email_address" => $email,
            "status" => "subscribed"
        ]);
        
        // Initiate cURL request to Mailchimp API
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_USERPWD, 'user:' . $apiKey);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        // Log error if it failed, but don't crash the user response
        if ($httpCode >= 400) {
            error_log("Mailchimp API Error (Code {$httpCode}): " . $response);
        }
    }

    echo json_encode(["success" => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
}
?>
