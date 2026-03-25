<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ContactController extends Controller
{
    /**
     * Show the contact form (Inertia page).
     */
    public function create()
    {
        return Inertia::render('Contact/ContactForm');
    }

    /**
     * Store a new contact message.
     *
     * Validates the reCAPTCHA token server-side before processing the request.
     */
    public function store(Request $request)
    {
        // 1. Basic field validation
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'email'           => ['required', 'email', 'max:255'],
            'message'         => ['required', 'string', 'max:5000'],
            'recaptcha_token' => ['required', 'string'],
        ]);

        // 2. Verify the token with Google's siteverify API
        $this->verifyRecaptcha($request->input('recaptcha_token'), $request->ip());

        // 3. Your business logic here (save to DB, send email, etc.)
        // ContactMessage::create($validated);
        // Mail::to(config('mail.to'))->send(new ContactMail($validated));

        return back()->with('success', 'Your message has been sent!');
    }

    /**
     * Send the reCAPTCHA token to Google and throw a validation error if it fails.
     *
     * @throws ValidationException
     */
    private function verifyRecaptcha(string $token, string $ip): void
    {
        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret'   => config('services.recaptcha.secret_key'),
            'response' => $token,
            'remoteip' => $ip,          // optional but recommended
        ]);

        if (! $response->successful() || ! $response->json('success')) {
            $errorCodes = $response->json('error-codes', []);

            throw ValidationException::withMessages([
                'recaptcha_token' => __('reCAPTCHA verification failed. Please try again.'),
            ]);
        }
    }
}
