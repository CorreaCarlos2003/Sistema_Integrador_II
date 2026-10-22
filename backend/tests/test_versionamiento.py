import unittest
from types import SimpleNamespace
from unittest.mock import patch

from main import app
from app.services.chat_v2_service import ChatV2Service
from app.services.documento_service import siguiente_numero_version


class VersionamientoBackendTests(unittest.TestCase):
    def test_siguiente_numero_se_calcula_en_backend(self):
        self.assertEqual(siguiente_numero_version([]), "1")
        self.assertEqual(siguiente_numero_version(["1", "2", "3"]), "4")
        self.assertEqual(siguiente_numero_version(["1", "borrador", "4"]), "5")

    def test_openapi_expone_historial_y_carga_de_version(self):
        operaciones = app.openapi()["paths"][
            "/proyectos/{id_proyecto}/documentos/{id_documento}/versiones"
        ]
        self.assertIn("get", operaciones)
        self.assertIn("post", operaciones)

    @patch("app.services.chat_v2_service.os.path.isfile", return_value=True)
    @patch("app.services.chat_v2_service.rag_service.extraer_bloques_docx")
    def test_seccion_termina_ante_encabezado_de_mayor_jerarquia(
        self, extraer_bloques, _archivo_existe,
    ):
        extraer_bloques.return_value = [
            ("Alcance", "Heading 2"),
            ("Contenido de alcance", "Normal"),
            ("Condiciones generales", "Heading 1"),
            ("Contenido que no pertenece al alcance", "Normal"),
        ]
        version = SimpleNamespace(ruta_archivo="contrato.docx")

        texto = ChatV2Service._texto_version(version, "Alcance")

        self.assertEqual(texto, "Alcance\nContenido de alcance")


if __name__ == "__main__":
    unittest.main()
