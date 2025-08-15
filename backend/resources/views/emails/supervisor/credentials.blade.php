@component('mail::message')
# Hello {{ $supervisorName }},

Your **PROTRACK** supervisor account has been created.

- **Supervisor ID:** {{ $supervisorId }}
- **Temporary Password:** {{ $password }}

Please sign in and change your password immediately.

Thanks,<br>
PROTRACK Team
@endcomponent
