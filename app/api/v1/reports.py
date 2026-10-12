from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.schema_models import AuditLog, User
from app.api.deps import has_permission
from app.services.report_service import generate_csv_report, generate_pdf_report

router = APIRouter()

@router.get("/compliance")
def export_compliance_report(
    format: str = Query("pdf", pattern="^(pdf|csv)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("audit:export"))
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.asc()).all()
    
    if format == "csv":
        csv_data = generate_csv_report(logs)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=compliance_audit_report.csv"}
        )
    else:
        pdf_bytes = generate_pdf_report(logs)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=compliance_audit_report.pdf"}
        )
