@component('mail::message')
# Hello {{ $adminName }},

Your **PROTRACK** admin account has been created.

- **Admin ID:** {{ $adminId }}
- **Temporary Password:** {{ $password }}

Please sign in and change your password immediately.

Thanks,<br>
PROTRACK Team
@endcomponent
