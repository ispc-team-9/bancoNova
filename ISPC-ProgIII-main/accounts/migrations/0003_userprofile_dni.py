from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_passwordresetotp'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='dni',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
    ]
