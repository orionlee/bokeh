# Standard library imports
from dataclasses import dataclass
from typing import NotRequired, TypedDict

# Bokeh imports
from ..core.enums import RadiusDimensionType
from ..core.property.vectorization import Expr, Field, Value
from ..model import Model
from .expressions import Expression
from .transforms import Transform

#__all__: Literal["Circle"]

class NonNegative[T]:
    ...

type FieldName = str

class ValueDict[ValueType](TypedDict):
    value: ValueType
    transform: NotRequired[Transform]

class FieldDict(TypedDict):
    field: FieldName
    transform: NotRequired[Transform]

class ExprDict(TypedDict):
    expr: Expression
    transform: NotRequired[Transform]

type VectorInit[ValueType] = Value | Field | Expr
type VectorDict[ValueType] = ValueDict[ValueType] | FieldDict | ExprDict
type VectorLike[ValueType] = VectorInit[ValueType] | VectorDict[ValueType]

type Vectorized[ValueType] = FieldName | ValueType | VectorLike[ValueType]

type VectorizedNumber = Vectorized[float]

@dataclass
class Circle(Model):

    #def __init__(self,
    #    *,
    #    name: str = ...,
    #    x: Vectorized[float] = ...,
    #    y: Vectorized[float] = ...,
    #    radius_dimension: RadiusDimensionType,
    #    hit_dilation: NonNegative[float],
    #) -> None:
    #     ...

    x: Vectorized[float] = ...
    y: Vectorized[float] = ...

    #radius: DistanceSpec = ...

    radius_dimension: RadiusDimensionType = ...

    hit_dilation: NonNegative[float] = ...
