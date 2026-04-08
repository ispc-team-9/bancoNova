import json
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings


def verify_recaptcha_token(token: str, remote_ip: str | None = None) -> tuple[bool, str | None]:
    secret_key = getattr(settings, 'RECAPTCHA_SECRET_KEY', '').strip()

    if not secret_key:
        if settings.DEBUG:
            return True, None
        return False, 'reCAPTCHA no configurado en el servidor.'

    if not token:
        return False, 'Debes completar la verificacion reCAPTCHA.'

    payload: dict[str, str] = {
      'secret': secret_key,
      'response': token,
    }
    if remote_ip:
        payload['remoteip'] = remote_ip

    data = urlencode(payload).encode('utf-8')
    request = Request(
        'https://www.google.com/recaptcha/api/siteverify',
        data=data,
        method='POST',
    )

    try:
        with urlopen(request, timeout=8) as response:
            response_data = response.read().decode('utf-8')
            parsed = json.loads(response_data)
    except (URLError, TimeoutError, json.JSONDecodeError):
        return False, 'No fue posible validar reCAPTCHA. Intenta nuevamente.'

    if parsed.get('success') is True:
        return True, None

    return False, 'Verificacion reCAPTCHA invalida. Vuelve a intentarlo.'