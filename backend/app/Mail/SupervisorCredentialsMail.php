<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SupervisorCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $supervisorName;
    public string $supervisorId;
    public string $password;

    public function __construct(string $supervisorName, string $supervisorId, string $password)
    {
        $this->supervisorName = $supervisorName;
        $this->supervisorId   = $supervisorId;
        $this->password       = $password;
    }

    public function build()
    {
        return $this->subject('Your PROTRACK Supervisor Credentials')
            ->markdown('emails.supervisor.credentials', [
                'supervisorName' => $this->supervisorName,
                'supervisorId'   => $this->supervisorId,
                'password'       => $this->password,
            ]);
    }
}
