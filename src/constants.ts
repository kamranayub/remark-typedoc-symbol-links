import { ReflectionKind } from 'typedoc'

export const SYMBOL_CONTAINERS = [
  ReflectionKind.Class,
  ReflectionKind.Interface,
  ReflectionKind.Enum,
  ReflectionKind.Module,
  ReflectionKind.SomeModule,
]

export const SYMBOL_LINK_KINDS = [
  ReflectionKind.Enum,
  ReflectionKind.EnumMember,
  ReflectionKind.Class,
  ReflectionKind.Interface,
  ReflectionKind.Constructor,
  ReflectionKind.Property,
  ReflectionKind.Method,
  ReflectionKind.Accessor,
  ReflectionKind.Function,
  ReflectionKind.TypeAlias,
  ReflectionKind.ObjectLiteral,
]
