<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\SupabaseUserController;
use Illuminate\Http\Request;

$controller = new SupabaseUserController();

echo "--- 1. Testing GET /api/users from Supabase via Laravel ---\n";
$getResponse = $controller->index();
echo "Status Code: " . $getResponse->getStatusCode() . "\n";
echo "Response: " . $getResponse->getContent() . "\n\n";

echo "--- 2. Creating a test user via Laravel -> Supabase ---\n";
$req = Request::create('/api/users', 'POST', [
    'email' => 'laravel_user_' . time() . '@example.com',
    'full_name' => 'Laravel Supabase Tester',
    'role' => 'admin'
]);
$postResponse = $controller->store($req);
echo "Status Code: " . $postResponse->getStatusCode() . "\n";
echo "Response: " . $postResponse->getContent() . "\n\n";

echo "--- 3. Re-testing GET /api/users from Supabase ---\n";
$getResponse2 = $controller->index();
echo "Status Code: " . $getResponse2->getStatusCode() . "\n";
echo "Response: " . $getResponse2->getContent() . "\n";
