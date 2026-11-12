"""O treino de reserva entende objetivos escritos com as palavras do usuário."""

import pytest

from services.ia_service import classificar_objetivo


@pytest.mark.parametrize(
    ("texto", "esperado"),
    [
        ("Quero pular mais alto", "forca"),
        ("ganhar impulsão no vôlei", "forca"),
        ("perder barriga", "emagrecimento"),
        ("correr mais rápido", "condicionamento"),
        ("Hipertrofia", "hipertrofia"),
        ("treinar para maratona", "resistencia"),
        ("melhorar a postura", "melhorar a postura"),
    ],
)
def test_classifica_objetivo_livre(texto, esperado):
    assert classificar_objetivo(texto) == esperado
