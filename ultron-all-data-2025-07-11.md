Please analyze this project and task data and create optimized schedules:

**SCHEDULING REQUEST:**
Create three schedules focusing on all items:
1. **Today (2025-07-11)** - Detailed hourly schedule
2. **Tomorrow (2025-07-12)** - Detailed hourly schedule  
3. **This Business Week (through 2025-07-11)** - Daily overview

**CONSTRAINTS:**
Schedule business tasks (8 AM-5 PM weekdays) and personal tasks (6 PM+ weekdays, anytime weekends).

**OUTPUT FORMAT:**
Please format the response as Markdown that I can copy-paste into my schedule text box:

```markdown
# Today's Schedule (2025-07-11)

## Morning (8:00 AM - 12:00 PM)
- [ ] 9:00 AM - [Task Name] - [Project] (Priority: High)
- [ ] 10:30 AM - [Task Name] - [Project] 

## Afternoon (1:00 PM - 5:00 PM)
- [ ] 1:00 PM - [Task Name] - [Project]
- [ ] 3:00 PM - [Task Name] - [Project]

## Evening (6:00 PM+) [Personal time]
- [ ] 7:00 PM - [Personal Task]

# Tomorrow's Schedule (2025-07-12)
[Similar format...]

# This Week Overview
## 2025-07-11 - Focus: [Key Theme]
## 2025-07-12 - Focus: [Key Theme]
[Continue for business week...]
```

**DATA TO ANALYZE:**

```json
{
  "exportInfo": {
    "type": "all",
    "exportDate": "2025-07-11T22:34:11.003Z",
    "projectCount": 6,
    "taskCount": 12
  },
  "projects": [
    {
      "id": "ae3e4b8a-74ed-4e83-86c3-871c0610b0c1",
      "title": "Facilities",
      "description": null,
      "status": "active",
      "context": "",
      "project_context": "personal",
      "deadline": null,
      "goals": [],
      "tags": [],
      "business_relevance": 5
    },
    {
      "id": "feba9f77-41e5-40af-aced-580b4995c569",
      "title": "Clinica Medicos",
      "description": null,
      "status": "active",
      "context": "",
      "project_context": "personal",
      "deadline": null,
      "goals": [],
      "tags": [],
      "business_relevance": 5
    },
    {
      "id": "b85638a2-1dd9-4d28-a365-1ca759110ba2",
      "title": "Therapy Notes",
      "description": null,
      "status": "active",
      "context": "",
      "project_context": "personal",
      "deadline": null,
      "goals": [
        "Try to finish the notes the same day as the counseling event session, but if not the next day."
      ],
      "tags": [],
      "business_relevance": 10
    },
    {
      "id": "dd97ea12-f3b5-49b5-949f-43a748a8fe1b",
      "title": "Tech",
      "description": null,
      "status": "active",
      "context": "",
      "project_context": "personal",
      "deadline": null,
      "goals": [],
      "tags": [],
      "business_relevance": 5
    },
    {
      "id": "855b35c6-88c1-4b15-8cbe-f8a9af2623c3",
      "title": "1148",
      "description": null,
      "status": "active",
      "context": "This contains everything that needs to be done inside of phase 2 and 3 of the new Clinic build out.",
      "project_context": "personal",
      "deadline": null,
      "goals": [],
      "tags": [
        "construction",
        "facilities",
        "tech"
      ],
      "business_relevance": 10
    },
    {
      "id": "0e92f643-e577-4591-a6d6-63cddddcdaec",
      "title": "Renuevo",
      "description": null,
      "status": "active",
      "context": "This contains all the tasks that have to do with the Behavioral Health Team and Initiative.",
      "project_context": "personal",
      "deadline": null,
      "goals": [],
      "tags": [],
      "business_relevance": 10
    }
  ],
  "tasks": [
    {
      "id": "37f34b4a-e660-4a25-9ebf-c16aff9450ae",
      "title": "Update the pregnancy brochure",
      "description": null,
      "status": "todo",
      "priority": "medium",
      "due_date": "2025-07-18T00:00:00+00:00",
      "project_id": "0e92f643-e577-4591-a6d6-63cddddcdaec",
      "project_name": "Renuevo",
      "tags": [
        "office",
        "media"
      ],
      "progress": 0
    },
    {
      "id": "60445a64-1165-4dd4-b693-a27c95c0ce15",
      "title": "Look into credentialing",
      "description": null,
      "status": "todo",
      "priority": "medium",
      "due_date": "2025-07-14T00:00:00+00:00",
      "project_id": "0e92f643-e577-4591-a6d6-63cddddcdaec",
      "project_name": "Renuevo",
      "tags": [
        "counseling",
        "admin",
        "office"
      ],
      "progress": 0
    },
    {
      "id": "c58a7a04-7f07-4bd0-979a-0c7f9bc2385d",
      "title": "Progress Note - 2025-07-15",
      "description": null,
      "status": "todo",
      "priority": "medium",
      "due_date": "2025-07-15T00:00:00+00:00",
      "project_id": "b85638a2-1dd9-4d28-a365-1ca759110ba2",
      "project_name": "Therapy Notes",
      "tags": [
        "progress-note",
        "therapy",
        "documentation"
      ],
      "progress": 0
    },
    {
      "id": "436934ee-a96b-48c5-95cf-be54384e7072",
      "title": "Progress Note - 2025-07-14",
      "description": null,
      "status": "todo",
      "priority": "medium",
      "due_date": "2025-07-14T00:00:00+00:00",
      "project_id": "b85638a2-1dd9-4d28-a365-1ca759110ba2",
      "project_name": "Therapy Notes",
      "tags": [
        "progress-note",
        "therapy",
        "documentation"
      ],
      "progress": 0
    },
    {
      "id": "aeca342a-73ce-4d04-b9b6-d90fc7562e98",
      "title": "Progress Note - 2025-07-14",
      "description": null,
      "status": "todo",
      "priority": "medium",
      "due_date": "2025-07-14T00:00:00+00:00",
      "project_id": "b85638a2-1dd9-4d28-a365-1ca759110ba2",
      "project_name": "Therapy Notes",
      "tags": [
        "progress-note",
        "therapy",
        "documentation"
      ],
      "progress": 0
    },
    {
      "id": "99e8c292-8010-4327-902b-556b869669be",
      "title": "Progress Note - 2025-07-14",
      "description": null,
      "status": "todo",
      "priority": "medium",
      "due_date": "2025-07-14T00:00:00+00:00",
      "project_id": "b85638a2-1dd9-4d28-a365-1ca759110ba2",
      "project_name": "Therapy Notes",
      "tags": [
        "progress-note",
        "therapy",
        "documentation"
      ],
      "progress": 0
    },
    {
      "id": "b3e453be-2c6d-4bbc-819a-4aeaa2c804fb",
      "title": "check out 1148 phone",
      "description": null,
      "status": "completed",
      "priority": "medium",
      "due_date": "2025-07-11T00:00:00+00:00",
      "project_id": "dd97ea12-f3b5-49b5-949f-43a748a8fe1b",
      "project_name": "Tech",
      "tags": [],
      "progress": 0
    },
    {
      "id": "3ace68b8-0bcb-47e8-b895-0aed2769ae47",
      "title": "Collect EPB phones",
      "description": null,
      "status": "completed",
      "priority": "medium",
      "due_date": "2025-07-16T00:00:00+00:00",
      "project_id": "dd97ea12-f3b5-49b5-949f-43a748a8fe1b",
      "project_name": "Tech",
      "tags": [],
      "progress": 0
    },
    {
      "id": "9a971ec5-031a-45ac-af32-26f7eea5b40c",
      "title": "Progress Note - 2025-07-11",
      "description": null,
      "status": "completed",
      "priority": "medium",
      "due_date": "2025-07-11T00:00:00+00:00",
      "project_id": "b85638a2-1dd9-4d28-a365-1ca759110ba2",
      "project_name": "Therapy Notes",
      "tags": [
        "progress-note",
        "therapy",
        "documentation"
      ],
      "progress": 0
    },
    {
      "id": "6eb6c123-62ae-4b12-b22a-1317518aecab",
      "title": "Blinds for exam room",
      "description": null,
      "status": "todo",
      "priority": "high",
      "due_date": "2025-07-11T00:00:00+00:00",
      "project_id": "855b35c6-88c1-4b15-8cbe-f8a9af2623c3",
      "project_name": "1148",
      "tags": [],
      "progress": 56
    },
    {
      "id": "d12bfe81-46fd-406c-b98a-075f7acdf268",
      "title": "Electrical and millworks",
      "description": null,
      "status": "completed",
      "priority": "urgent",
      "due_date": "2025-07-09T00:00:00+00:00",
      "project_id": "855b35c6-88c1-4b15-8cbe-f8a9af2623c3",
      "project_name": "1148",
      "tags": [
        "phase 3"
      ],
      "progress": 0
    },
    {
      "id": "e3d3f286-c7c0-4288-8ae7-f8e0846c8704",
      "title": "Create and send next chapter",
      "description": null,
      "status": "completed",
      "priority": "medium",
      "due_date": "2025-07-09T00:00:00+00:00",
      "project_id": "0e92f643-e577-4591-a6d6-63cddddcdaec",
      "project_name": "Renuevo",
      "tags": [
        "coaching",
        "team meetings"
      ],
      "progress": 100
    }
  ]
}
```