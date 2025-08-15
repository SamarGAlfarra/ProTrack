@component('mail::message')
# Hello {{ $studentName }},

Your **PROTRACK** student account has been created.

- **Student ID:** {{ $studentId }}
- **Temporary Password:** {{ $password }}

Please sign in and change your password immediately.

Thanks,<br>
PROTRACK Team
@endcomponent

