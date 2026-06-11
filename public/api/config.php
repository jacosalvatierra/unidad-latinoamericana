<?php
// Prevent direct access to this file
if (count(get_included_files()) == 1) {
    http_response_code(403);
    exit("Direct access forbidden");
}

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Cache-control header definitions (SiteGround Cache Bypass)
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

// Config parameters
define('DB_FILE', __DIR__ . '/unidad_latinoamericana.db');
define('ADMIN_EMAIL', 'jacosalvatierra@gmail.com');
define('SITE_URL', 'https://joaquins36.sg-host.com'); // Update after domain migration
define('APPROVAL_SECRET', 'UL_SecretToken_2026!'); // Secret key for approval link hashing

// Mailchimp configurations (optional)
define('MAILCHIMP_API_KEY', ''); // Add your Mailchimp API Key here
define('MAILCHIMP_LIST_ID', ''); // Add your Mailchimp Audience/List ID here
?>
