from django.core.mail import send_mail
from django.http import HttpResponse
from mit.class_views import SimpleView
from rest_framework.renderers import JSONRenderer
import json

from mit.serializers import (
        GenericWorkSerializer,
        LocationSerializer,
        TopicSerializer,
        FacultySerializer,
        ContentTypeSerializer,
        WorkTypeSerializer
        )

from django.contrib.contenttypes.models import ContentType
from mit.models import (
        Faculty,
        Location,
        Topic,
        GenericWork,
        WorkType,
        )

class JSONifier:
    def __init__(self):
        self.renderer = JSONRenderer()
    def __call__(self, serializer):
        return self.renderer.render(serializer.data)

R = JSONifier()

# add jsons to context
# for projects, only add to works to projects json if work_types = 6; Projects in the DB work_type ID = 6
ctx = {
        'jsons': {
            'topics': R(TopicSerializer(Topic.objects.all(), many=True)),
            'locations': R(LocationSerializer(Location.objects.all(), many=True)),
            'faculty': R(FacultySerializer(Faculty.objects.all(), many=True)),
            'works': R(GenericWorkSerializer(GenericWork.objects.all(),
                many=True)),
            'models': R(ContentTypeSerializer(
                ContentType.objects.filter(app_label='mit'), many=True)),
            'worktypes': R(WorkTypeSerializer(WorkType.objects.all(), many=True)),
            'projects': R(GenericWorkSerializer(GenericWork.objects.filter(work_types__exact=6),
                many=True)),
            }
        }


home = SimpleView( 'DUSP Explorer', 'index.html', ctx )


def ajax_form_submit(request):
    """  
    This view handles the feedback form submission. 
    """
    if request.is_ajax():
        data = {}
        name = request.POST.get('name', None)
        email = request.POST.get('email', None)
        address = request.POST.get('address', None)
        comments = request.POST.get('comments', None)
        if (name is None):
            return HttpResponse(status=400)
        if (email is None):
            return HttpResponse(status=400)
        if (comments is None):
            return HttpResponse(status=400)

        if not address: # if honeypot is empty, continue processing form
            message = "Name: " + name + "\n\nEmail: " + email + "\n\nComments: " + comments
            send_mail('DUSP Explorer Feedback Form Submitted', message, 'dusp.explorer@gmail.com', ['dusp.explorer@gmail.com'], fail_silently=False)        
            data['success'] = "Thank you for submitting your feedback " + name + "!"
        else:
            data['error'] = "You are a robot!"
        return HttpResponse(json.dumps(data), content_type="application/json")
    else:
        return HttpResponse(status=400)



