from mit.class_views import SimpleView
from rest_framework.renderers import JSONRenderer

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

