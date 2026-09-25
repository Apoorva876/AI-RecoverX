from app.services.forensic_analysis import analyze_uploaded_file


def test_analyze_uploaded_file_repairs_corrupted_text():
    payload = b"ID,Name,Amount\r\n1,Alpha,100\r\n2,Beta,\x00\r\n3,Gamma,250\n"

    result = analyze_uploaded_file(payload, "demo.csv")

    assert result["is_recoverable"] is True
    assert result["repaired_file_name"].endswith(".csv")
    assert "Alpha" in result["repaired_preview"]
    assert len(result["recovered_items"]) >= 1
