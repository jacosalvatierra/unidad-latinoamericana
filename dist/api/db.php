<?php
require_once __DIR__ . '/config.php';

try {
    // Open or create SQLite Database file
    $db = new PDO("sqlite:" . DB_FILE);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Enable Foreign Keys
    $db->exec('PRAGMA foreign_keys = ON;');

    // Table 1: Initiatives (Associations, creators, etc.)
    $db->exec("CREATE TABLE IF NOT EXISTS initiatives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        description TEXT,
        logo TEXT,
        website TEXT,
        instagram TEXT,
        facebook TEXT,
        status TEXT DEFAULT 'pending', -- pending, active
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Table 2: Events
    $db->exec("CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        initiative_id INTEGER,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        flyer TEXT,
        visibility TEXT DEFAULT 'public', -- public, members
        needs_help INTEGER DEFAULT 0, -- 0 or 1
        status TEXT DEFAULT 'active', -- active, cancelled, deleted
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (initiative_id) REFERENCES initiatives(id) ON DELETE CASCADE
    )");

    // Table 3: Subscribers (Newsletter)
    $db->exec("CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Initialize sample data if initiatives table is completely empty (for easy testing on first deploy)
    $stmt = $db->query("SELECT COUNT(*) as count FROM initiatives");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        // Create an admin/sample initiative
        // Default password is 'unidad123' (hashed)
        $hashedPassword = password_hash('unidad123', PASSWORD_DEFAULT);
        $db->exec("INSERT INTO initiatives (name, email, password, description, logo, website, instagram, facebook, status)
            VALUES (
                'Asociación Cantapueblo', 
                'info@cantapueblo.de', 
                '$hashedPassword', 
                'Asociación y coro latinoamericano en Múnich. Fomentamos la integración a través de la música y eventos culturales tradicionales.',
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
                'https://cantapueblo.de',
                'https://instagram.com/cantapueblo.de',
                '',
                'active'
            )");
            
        // Insert a sample event
        $db->exec("INSERT INTO events (initiative_id, title, date, time, category, location, description, flyer, visibility, needs_help)
            VALUES (
                1,
                'Gran Peña Folklórica Cantapueblo',
                '2026-07-25',
                '19:00',
                'festival',
                'EineWeltHaus, Múnich',
                'Una noche de música folklórica latinoamericana, bailes tradicionales y deliciosas empanadas. Entrada libre con donación sugerida.',
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
                'public',
                1
            )");
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database Connection Error: " . $e->getMessage()]);
    exit;
}
?>
