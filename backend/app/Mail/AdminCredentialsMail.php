// app/Mail/AdminCredentialsMail.php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $adminName;
    public string $adminId;
    public string $password;

    public function __construct(string $adminName, string $adminId, string $password)
    {
        $this->adminName = $adminName;
        $this->adminId   = $adminId;
        $this->password  = $password;
    }

    public function build()
    {
        return $this->subject('Your ProTrack Admin Account')
            ->view('emails.admin_credentials');
    }
}
