import io, json, httpx

async def send_to_backend(backend_url, project_id, image_filename, image_bytes, detections, content_type):
    form_data = {"project_id": project_id, "annotations": json.dumps(detections)}
    files = {"images": (image_filename, io.BytesIO(image_bytes), content_type)}

    backend_status, backend_message = "skipped", "Backend call skipped or failed"
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(backend_url, data=form_data, files=files)
            resp.raise_for_status()
            backend_status, backend_message = "success", "Results sent to backend"
    except Exception as e:
        backend_status, backend_message = "failed", str(e)

    return backend_status, backend_message
