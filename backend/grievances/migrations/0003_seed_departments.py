from django.db import migrations


def add_departments(apps, schema_editor):
    Department = apps.get_model('grievances', 'Department')

    departments = [
        {
            'name': 'Health Department',
            'description': 'Public health services, hospitals and medical facilities.'
        },
        {
            'name': 'Education Department',
            'description': 'Schools, colleges and public education services.'
        },
        {
            'name': 'Public Works Department (PWD)',
            'description': 'Roads, bridges and public infrastructure.'
        },
        {
            'name': 'Water Supply Department',
            'description': 'Drinking water supply and water-related complaints.'
        },
        {
            'name': 'Electricity Department',
            'description': 'Electricity supply and power-related complaints.'
        },
        {
            'name': 'Local Self Government Department',
            'description': 'Panchayat, municipality and local civic services.'
        },
    ]

    for department in departments:
        Department.objects.get_or_create(
            name=department['name'],
            defaults={'description': department['description']}
        )


class Migration(migrations.Migration):

    dependencies = [
    ('grievances', '0002_resolutionreport'),
]
    

    operations = [
        migrations.RunPython(add_departments, migrations.RunPython.noop),
    ]