<?php
/**
 * Add this to config/services.php
 *
 * Then set these in your .env:
 *   RECAPTCHA_SITE_KEY=your_site_key_here
 *   RECAPTCHA_SECRET_KEY=your_secret_key_here
 *
 * And in resources/js (Vite front-end):
 *   VITE_RECAPTCHA_SITE_KEY="${RECAPTCHA_SITE_KEY}"
 */

return [
    // ... other services ...

    'recaptcha' => [
        'site_key'   => env('RECAPTCHA_SITE_KEY'),
        'secret_key' => env('RECAPTCHA_SECRET_KEY'),
    ],
];
