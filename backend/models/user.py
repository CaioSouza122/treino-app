from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.connection import Base
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "app_usuarios"

    id = Column(String, primary_key=True, default=generate_uuid)
    altura = Column(Float, nullable=False)
    peso = Column(Float, nullable=False)
    idade = Column(Integer, nullable=False)
    vezes_por_semana = Column(Integer, nullable=False)
    objetivo = Column(String, nullable=False)
    nivel = Column(String, default="intermediario")
    tempo = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")

class Workout(Base):
    __tablename__ = "app_treinos"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("app_usuarios.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamentos
    user = relationship("User", back_populates="workouts")
    days = relationship("WorkoutDay", back_populates="workout", cascade="all, delete-orphan")

class WorkoutDay(Base):
    __tablename__ = "app_treino_dias"

    id = Column(String, primary_key=True, default=generate_uuid)
    workout_id = Column(String, ForeignKey("app_treinos.id", ondelete="CASCADE"), nullable=False)
    dia = Column(String, nullable=False)          # Ex: "Treino A"
    foco = Column(String, nullable=False)         # Ex: "Peito e Tríceps"
    exercicios = Column(String, nullable=False)   # String com quebras de linha dos exercícios

    # Relacionamento
    workout = relationship("Workout", back_populates="days")
