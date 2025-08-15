<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class StudentCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $studentName;
    public string $studentId;
    public string $password;

    public function __construct(string $studentName, string $studentId, string $password)
    {
        $this->studentName = $studentName;
        $this->studentId   = $studentId;
        $this->password       = $password;
    }

    public function build()
    {
        return $this->subject('Your PROTRACK Student Credentials')
            ->markdown('emails.student.credentials', [
                'studentName' => $this->studentName,
                'studentId'   => $this->studentId,
                'password'       => $this->password,
            ]);
    }
}
