"""
Test suite for offline game files served via /api/content/games/ endpoint
Tests the 4 game files uploaded for the Instructor Toolbox:
- ie-grinch-bingo-game-pk.pdf
- ie-grinch-bingo-card-pk.pdf
- ie-passport-trek-game.pdf
- map-journey-reference-index.docx
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGameFilesEndpoint:
    """Test that all 4 game files are served correctly via /api/content/games/"""
    
    def test_grinch_bingo_game_pack_pdf(self):
        """Test ie-grinch-bingo-game-pk.pdf is served with correct content-type"""
        response = requests.get(f"{BASE_URL}/api/content/games/ie-grinch-bingo-game-pk.pdf", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        content_type = response.headers.get('content-type', '')
        assert 'application/pdf' in content_type, f"Expected PDF content-type, got {content_type}"
        # Verify file has content
        assert len(response.content) > 10000, f"File seems too small: {len(response.content)} bytes"
        print(f"✅ ie-grinch-bingo-game-pk.pdf: {len(response.content)} bytes, content-type: {content_type}")
    
    def test_grinch_bingo_cards_pdf(self):
        """Test ie-grinch-bingo-card-pk.pdf is served with correct content-type"""
        response = requests.get(f"{BASE_URL}/api/content/games/ie-grinch-bingo-card-pk.pdf", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        content_type = response.headers.get('content-type', '')
        assert 'application/pdf' in content_type, f"Expected PDF content-type, got {content_type}"
        assert len(response.content) > 10000, f"File seems too small: {len(response.content)} bytes"
        print(f"✅ ie-grinch-bingo-card-pk.pdf: {len(response.content)} bytes, content-type: {content_type}")
    
    def test_passport_trek_game_pdf(self):
        """Test ie-passport-trek-game.pdf is served with correct content-type"""
        response = requests.get(f"{BASE_URL}/api/content/games/ie-passport-trek-game.pdf", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        content_type = response.headers.get('content-type', '')
        assert 'application/pdf' in content_type, f"Expected PDF content-type, got {content_type}"
        assert len(response.content) > 10000, f"File seems too small: {len(response.content)} bytes"
        print(f"✅ ie-passport-trek-game.pdf: {len(response.content)} bytes, content-type: {content_type}")
    
    def test_map_journey_reference_docx(self):
        """Test map-journey-reference-index.docx is served with correct content-type"""
        response = requests.get(f"{BASE_URL}/api/content/games/map-journey-reference-index.docx", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        content_type = response.headers.get('content-type', '')
        # DOCX files should have application/vnd.openxmlformats-officedocument.wordprocessingml.document
        # or application/octet-stream
        valid_types = ['application/vnd.openxmlformats', 'application/octet-stream', 'application/msword']
        assert any(t in content_type for t in valid_types), f"Unexpected content-type: {content_type}"
        assert len(response.content) > 10000, f"File seems too small: {len(response.content)} bytes"
        print(f"✅ map-journey-reference-index.docx: {len(response.content)} bytes, content-type: {content_type}")
    
    def test_nonexistent_file_returns_404(self):
        """Test that requesting a non-existent file returns 404"""
        response = requests.get(f"{BASE_URL}/api/content/games/nonexistent-file.pdf", timeout=30)
        assert response.status_code == 404, f"Expected 404 for non-existent file, got {response.status_code}"
        print(f"✅ Non-existent file correctly returns 404")


class TestHealthCheck:
    """Basic health check to ensure backend is running"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/", timeout=30)
        assert response.status_code == 200, f"API root failed: {response.status_code}"
        data = response.json()
        assert 'message' in data
        print(f"✅ API root: {data.get('message', 'OK')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
