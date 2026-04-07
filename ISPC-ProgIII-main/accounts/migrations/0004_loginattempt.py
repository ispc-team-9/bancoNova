from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_userprofile_dni'),
    ]

    operations = [
        migrations.CreateModel(
            name='LoginAttempt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifier', models.CharField(max_length=20, unique=True)),
                ('attempts', models.PositiveSmallIntegerField(default=0)),
                ('locked_until', models.DateTimeField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
