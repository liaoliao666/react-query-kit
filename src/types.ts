import type {
  DataTag,
  DefaultError,
  DefinedUseInfiniteQueryResult,
  DefinedUseQueryResult,
  GetNextPageParamFunction,
  GetPreviousPageParamFunction,
  InfiniteData,
  InfiniteQueryObserverSuccessResult,
  MutationFunction,
  MutationKey,
  QueryClient,
  QueryFunction,
  QueryKey,
  QueryKeyHashFunction,
  QueryObserverSuccessResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'

// utils

type CompatibleWithV4<V5, V4> =
  InfiniteData<unknown> extends UseInfiniteQueryResult<
    InfiniteData<unknown>
  >['data']
    ? V5
    : V4

type CompatibleQueryFunction<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never
> = CompatibleWithV4<
  QueryFunction<T, TQueryKey, TPageParam>,
  QueryFunction<T, TQueryKey>
>

type CompatibleInfiniteQueryPageParamsOptions<
  TQueryFnData = unknown,
  TPageParam = unknown
> = CompatibleWithV4<
  {
    getPreviousPageParam?: GetPreviousPageParamFunction<
      TPageParam,
      TQueryFnData
    >
    getNextPageParam: GetNextPageParamFunction<TPageParam, TQueryFnData>
    initialPageParam: TPageParam
  },
  {
    getPreviousPageParam?: GetPreviousPageParamFunction<TQueryFnData>
    getNextPageParam: GetNextPageParamFunction<TQueryFnData>
  }
>

type CompatibleUseInfiniteQueryOptions<
  TFnData,
  TVariables,
  TData,
  TError,
  TPageParam
> = CompatibleWithV4<
  UseInfiniteQueryOptions<
    TFnData,
    TError,
    TData,
    TFnData,
    inferQueryKey<TFnData, TVariables, TPageParam>,
    TPageParam
  >,
  UseInfiniteQueryOptions<
    TFnData,
    TError,
    TData,
    TFnData,
    inferQueryKey<TFnData, TVariables, TPageParam>
  >
>

type CompatibleInfiniteData<TFnData, TPageParam> = CompatibleWithV4<
  InfiniteData<TFnData, TPageParam>,
  InfiniteData<TFnData>
>

type NonUndefinedGuard<T> = T extends undefined ? never : T

type WithRequired<T, K extends keyof T> = T & {
  [_ in K]: {}
}

export type CompatibleError = CompatibleWithV4<DefaultError, Error>

type GetQueryKey<TVariables> = TVariables extends void
  ? [string]
  : [string, TVariables]

export type inferQueryKey<
  TFnData,
  TVariables,
  TPageParam = never
> = CompatibleWithV4<
  DataTag<
    GetQueryKey<TVariables>,
    [TPageParam] extends [never] ? TFnData : InfiniteData<TFnData, TPageParam>
  >,
  GetQueryKey<TVariables>
>

export type AdditionalQueryOptions<TFnData, TVariables, TPageParam = never> = {
  primaryKey: string
  queryFn: CompatibleQueryFunction<
    TFnData,
    inferQueryKey<TFnData, TVariables, TPageParam>,
    TPageParam
  >
  variables?: TVariables
}

type inferMiddlewareHook<T extends (...args: any) => any> = (
  options: inferCreateOptions<T>,
  queryClient?: CompatibleWithV4<QueryClient, void>
) => ReturnType<T>

export type Middleware<
  T extends (...args: any) => any = QueryHook<any, any, any>
> = (hook: inferMiddlewareHook<T>) => inferMiddlewareHook<T>

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export type ExposeMethods<TFnData, TVariables, TError, TPageParam = never> = {
  getPrimaryKey: () => string
  getKey: <V extends DeepPartial<TVariables> | void = void>(
    variables?: V
  ) => inferQueryKey<TFnData, V, TPageParam>
  queryFn: CompatibleQueryFunction<
    TFnData,
    inferQueryKey<TFnData, TVariables, TPageParam>,
    TPageParam
  >
  queryKeyHashFn: QueryKeyHashFunction<
    inferQueryKey<TFnData, TVariables, TPageParam>
  >
  getFetchOptions: (
    variables: TVariables extends void ? TVariables | void : TVariables
  ) => [TPageParam] extends [never]
    ? {
        queryKey: inferQueryKey<TFnData, TVariables>
        queryFn: CompatibleQueryFunction<
          TFnData,
          inferQueryKey<TFnData, TVariables>
        >
        queryKeyHashFn?: QueryKeyHashFunction<
          inferQueryKey<TFnData, TVariables>
        >
      }
    : {
        queryKey: inferQueryKey<TFnData, TVariables, TPageParam>
        queryFn: CompatibleQueryFunction<
          TFnData,
          inferQueryKey<TFnData, TVariables, TPageParam>,
          TPageParam
        >
        queryKeyHashFn?: QueryKeyHashFunction<
          inferQueryKey<TFnData, TVariables, TPageParam>
        >
      } & CompatibleInfiniteQueryPageParamsOptions<TFnData, TPageParam>
  getOptions: (
    variables: TVariables extends void ? TVariables | void : TVariables
  ) => [TPageParam] extends [never]
    ? CompatibleWithV4<
        UseQueryOptions<
          TFnData,
          TError,
          TFnData,
          DataTag<GetQueryKey<TVariables>, TFnData>
        >,
        // Not work to infer TError in v4
        {
          queryKey: GetQueryKey<TVariables>
          queryFn: QueryFunction<TFnData, GetQueryKey<TVariables>>
          queryKeyHashFn?: QueryKeyHashFunction<GetQueryKey<TVariables>>
        }
      >
    : CompatibleUseInfiniteQueryOptions<
        TFnData,
        TVariables,
        TFnData,
        TError,
        TPageParam
      >
}

// query hook

export interface CreateQueryOptions<
  TFnData = unknown,
  TVariables = void,
  TError = CompatibleError
> extends Omit<
      UseQueryOptions<
        TFnData,
        TError,
        TFnData,
        inferQueryKey<TFnData, TVariables>
      >,
      'queryKey' | 'queryFn' | 'select'
    >,
    AdditionalQueryOptions<TFnData, TVariables> {
  use?: Middleware<QueryHook<TFnData, TVariables, TError>>[]
  variables?: TVariables
}

export interface QueryHookOptions<TFnData, TError, TData, TVariables>
  extends Omit<
    UseQueryOptions<TFnData, TError, TData, inferQueryKey<TFnData, TVariables>>,
    'queryKey' | 'queryFn' | 'queryKeyHashFn'
  > {
  use?: Middleware<QueryHook<TFnData, TVariables, TError>>[]
  variables?: TVariables
}

export interface DefinedQueryHookOptions<TFnData, TError, TData, TVariables>
  extends Omit<
    QueryHookOptions<TFnData, TError, TData, TVariables>,
    'initialData'
  > {
  initialData: NonUndefinedGuard<TFnData> | (() => NonUndefinedGuard<TFnData>)
}

export type QueryHookResult<TData, TError> = UseQueryResult<TData, TError>

export type DefinedQueryHookResult<TData, TError> = DefinedUseQueryResult<
  TData,
  TError
>

export interface QueryHook<
  TFnData = unknown,
  TVariables = any,
  TError = CompatibleError
> extends ExposeMethods<TFnData, TVariables, TError> {
  <TData = TFnData>(
    options: DefinedQueryHookOptions<TFnData, TError, TData, TVariables>,
    queryClient?: CompatibleWithV4<QueryClient, void>
  ): DefinedQueryHookResult<TData, TError>
  <TData = TFnData>(
    options?: QueryHookOptions<TFnData, TError, TData, TVariables>,
    queryClient?: CompatibleWithV4<QueryClient, void>
  ): QueryHookResult<TData, TError>
}

// suspense query hook

export interface CreateSuspenseQueryOptions<
  TFnData = unknown,
  TVariables = void,
  TError = CompatibleError
> extends Omit<
      UseQueryOptions<
        TFnData,
        TError,
        TFnData,
        inferQueryKey<TFnData, TVariables>
      >,
      | 'queryKey'
      | 'queryFn'
      | 'enabled'
      | 'select'
      | 'suspense'
      | 'throwOnError'
      | 'placeholderData'
      | 'keepPreviousData'
      | 'useErrorBoundary'
    >,
    AdditionalQueryOptions<TFnData, TVariables> {
  use?: Middleware<SuspenseQueryHook<TFnData, TVariables, TVariables>>[]
  variables?: TVariables
}

export interface SuspenseQueryHookOptions<TFnData, TError, TData, TVariables>
  extends Omit<
    UseQueryOptions<TFnData, TError, TData, inferQueryKey<TFnData, TVariables>>,
    | 'queryKey'
    | 'queryFn'
    | 'queryKeyHashFn'
    | 'enabled'
    | 'suspense'
    | 'throwOnError'
    | 'placeholderData'
    | 'keepPreviousData'
    | 'useErrorBoundary'
  > {
  use?: Middleware<SuspenseQueryHook<TFnData, TVariables, TVariables>>[]
  variables?: TVariables
}

export type SuspenseQueryHookResult<TData, TError> = Omit<
  QueryObserverSuccessResult<TData, TError>,
  'isPlaceholderData' | 'isPreviousData'
>

export interface SuspenseQueryHook<
  TFnData = unknown,
  TVariables = void,
  TError = CompatibleError
> extends ExposeMethods<TFnData, TVariables, TError> {
  <TData = TFnData>(
    options?: SuspenseQueryHookOptions<TFnData, TError, TData, TVariables>,
    queryClient?: CompatibleWithV4<QueryClient, void>
  ): SuspenseQueryHookResult<TData, TError>
}

// infinite query hook

export interface CreateInfiniteQueryOptions<
  TFnData = unknown,
  TVariables = void,
  TError = CompatibleError,
  TPageParam = number
> extends Omit<
      CompatibleUseInfiniteQueryOptions<
        TFnData,
        TVariables,
        TFnData,
        TError,
        TPageParam
      >,
      'queryKey' | 'queryFn' | 'select'
    >,
    AdditionalQueryOptions<TFnData, TVariables, TPageParam> {
  use?: Middleware<InfiniteQueryHook<TFnData, TVariables, TError, TPageParam>>[]
  variables?: TVariables
}

export interface InfiniteQueryHookOptions<
  TFnData,
  TError,
  TData,
  TVariables,
  TPageParam = number
> extends Omit<
    CompatibleUseInfiniteQueryOptions<
      TFnData,
      TVariables,
      TData,
      TError,
      TPageParam
    >,
    | 'queryKey'
    | 'queryFn'
    | 'queryKeyHashFn'
    | 'initialPageParam'
    | 'getPreviousPageParam'
    | 'getNextPageParam'
  > {
  use?: Middleware<InfiniteQueryHook<TFnData, TVariables, TError, TPageParam>>[]
  variables?: TVariables
}

export interface DefinedInfiniteQueryHookOptions<
  TFnData,
  TError,
  TData,
  TVariables,
  TPageParam = number
> extends Omit<
    InfiniteQueryHookOptions<TFnData, TError, TData, TVariables, TPageParam>,
    'initialData'
  > {
  initialData:
    | NonUndefinedGuard<CompatibleInfiniteData<TFnData, TPageParam>>
    | (() => NonUndefinedGuard<CompatibleInfiniteData<TFnData, TPageParam>>)
}

export type InfiniteQueryHookResult<TData, TError> = UseInfiniteQueryResult<
  TData,
  TError
>

export type DefinedInfiniteQueryHookResult<TData, TError> = CompatibleWithV4<
  DefinedUseInfiniteQueryResult<TData, TError>,
  WithRequired<UseInfiniteQueryResult<TData, TError>, 'data'>
>

export interface InfiniteQueryHook<
  TFnData = unknown,
  TVariables = void,
  TError = CompatibleError,
  TPageParam = number
> extends ExposeMethods<TFnData, TVariables, TError, TPageParam> {
  <TData = CompatibleWithV4<InfiniteData<TFnData, TPageParam>, TFnData>>(
    options: DefinedInfiniteQueryHookOptions<
      TFnData,
      TError,
      TData,
      TVariables,
      TPageParam
    >,
    queryClient?: CompatibleWithV4<QueryClient, void>
  ): DefinedInfiniteQueryHookResult<TData, TError>
  <TData = CompatibleWithV4<InfiniteData<TFnData, TPageParam>, TFnData>>(
    options?: InfiniteQueryHookOptions<
      TFnData,
      TError,
      TData,
      TVariables,
      TPageParam
    >,
    queryClient?: CompatibleWithV4<QueryClient, void>
  ): InfiniteQueryHookResult<TData, TError>
}

// infinite sususpense query hook

export interface CreateSuspenseInfiniteQueryOptions<
  TFnData = unknown,
  TVariables = void,
  TError = CompatibleError,
  TPageParam = number
> extends Omit<
      CompatibleUseInfiniteQueryOptions<
        TFnData,
        TVariables,
        TFnData,
        TError,
        TPageParam
      >,
      | 'queryKey'
      | 'queryFn'
      | 'enabled'
      | 'select'
      | 'suspense'
      | 'throwOnError'
      | 'placeholderData'
      | 'keepPreviousData'
      | 'useErrorBoundary'
    >,
    AdditionalQueryOptions<TFnData, TVariables, TPageParam> {
  use?: Middleware<SuspenseInfiniteQueryHook<TFnData, TVariables, TVariables>>[]
  variables?: TVariables
}

export interface SuspenseInfiniteQueryHookOptions<
  TFnData,
  TError,
  TData,
  TVariables,
  TPageParam = number
> extends Omit<
    CompatibleUseInfiniteQueryOptions<
      TFnData,
      TVariables,
      TData,
      TError,
      TPageParam
    >,
    | 'queryKey'
    | 'queryFn'
    | 'queryKeyHashFn'
    | 'enabled'
    | 'initialPageParam'
    | 'getPreviousPageParam'
    | 'getNextPageParam'
    | 'suspense'
    | 'throwOnError'
    | 'placeholderData'
    | 'keepPreviousData'
    | 'useErrorBoundary'
  > {
  use?: Middleware<SuspenseInfiniteQueryHook<TFnData, TVariables, TVariables>>[]
  variables?: TVariables
}

export type SuspenseInfiniteQueryHookResult<TData, TError> = Omit<
  InfiniteQueryObserverSuccessResult<TData, TError>,
  'isPlaceholderData' | 'isPreviousData'
>

export interface SuspenseInfiniteQueryHook<
  TFnData = unknown,
  TVariables = void,
  TError = CompatibleError,
  TPageParam = number
> extends ExposeMethods<TFnData, TVariables, TError, TPageParam> {
  <TData = CompatibleWithV4<InfiniteData<TFnData, TPageParam>, TFnData>>(
    options?: SuspenseInfiniteQueryHookOptions<
      TFnData,
      TError,
      TData,
      TVariables,
      TPageParam
    >,
    queryClient?: CompatibleWithV4<QueryClient, void>
  ): SuspenseInfiniteQueryHookResult<TData, TError>
}

// mutation hook

export interface CreateMutationOptions<
  TData = unknown,
  TVariables = void,
  TError = CompatibleError,
  TContext = unknown
> extends UseMutationOptions<TData, TError, TVariables, TContext> {
  use?: Middleware<MutationHook<TData, TError, TVariables>>[]
}

export interface MutationHookOptions<TData, TError, TVariables, TContext>
  extends Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn' | 'mutationKey'
  > {
  use?: Middleware<MutationHook<TData, TError, TVariables>>[]
}

export type MutationHookResult<
  TData = unknown,
  TError = CompatibleError,
  TVariables = void,
  TContext = unknown
> = UseMutationResult<TData, TError, TVariables, TContext>

export interface MutationHook<
  TData = unknown,
  TVariables = void,
  TError = unknown,
  TDefaultContext = unknown
> {
  <TContext = TDefaultContext>(
    options?: MutationHookOptions<TData, TError, TVariables, TContext>,
    queryClient?: CompatibleWithV4<QueryClient, void>
  ): MutationHookResult<TData, TError, TVariables, TContext>
  getKey: () => MutationKey | undefined
  mutationFn: MutationFunction<TData, TVariables>
}

// infer types

export type inferVariables<T> = T extends QueryHook<any, infer TVariables, any>
  ? TVariables
  : T extends SuspenseQueryHook<any, infer TVariables, any>
  ? TVariables
  : T extends InfiniteQueryHook<any, infer TVariables, any>
  ? TVariables
  : T extends SuspenseInfiniteQueryHook<any, infer TVariables, any>
  ? TVariables
  : T extends MutationHook<any, infer TVariables, any>
  ? TVariables
  : never

export type inferData<T> = T extends QueryHook<infer TData, any, any>
  ? TData
  : T extends SuspenseQueryHook<infer TData, any, any>
  ? TData
  : T extends InfiniteQueryHook<infer TData, any, any, infer TPageParam>
  ? CompatibleInfiniteData<TData, TPageParam>
  : T extends SuspenseInfiniteQueryHook<infer TData, any, any, infer TPageParam>
  ? CompatibleInfiniteData<TData, TPageParam>
  : T extends MutationHook<infer TData, any, any>
  ? TData
  : never

export type inferFnData<T> = T extends QueryHook<infer TData, any, any>
  ? TData
  : T extends SuspenseQueryHook<infer TData, any, any>
  ? TData
  : T extends InfiniteQueryHook<infer TData, any, any>
  ? TData
  : T extends SuspenseInfiniteQueryHook<infer TData, any, any>
  ? TData
  : T extends MutationHook<infer TData, any, any>
  ? TData
  : never

export type inferError<T> = T extends QueryHook<any, any, infer TError>
  ? TError
  : T extends SuspenseQueryHook<any, any, infer TError>
  ? TError
  : T extends InfiniteQueryHook<any, any, infer TError>
  ? TError
  : T extends SuspenseInfiniteQueryHook<any, any, infer TError>
  ? TError
  : T extends MutationHook<any, any, infer TError>
  ? TError
  : never

export type inferOptions<T> = T extends QueryHook<
  infer TFnData,
  infer TVariables,
  infer TError
>
  ? QueryHookOptions<TFnData, TError, TFnData, TVariables>
  : T extends SuspenseQueryHook<infer TFnData, infer TVariables, infer TError>
  ? SuspenseQueryHookOptions<TFnData, TError, TFnData, TVariables>
  : T extends InfiniteQueryHook<
      infer TFnData,
      infer TVariables,
      infer TError,
      infer TPageParam
    >
  ? InfiniteQueryHookOptions<
      TFnData,
      TError,
      CompatibleWithV4<InfiniteData<TFnData, TPageParam>, TFnData>,
      TVariables,
      TPageParam
    >
  : T extends SuspenseInfiniteQueryHook<
      infer TFnData,
      infer TVariables,
      infer TError,
      infer TPageParam
    >
  ? SuspenseInfiniteQueryHookOptions<
      TFnData,
      TError,
      CompatibleWithV4<InfiniteData<TFnData, TPageParam>, TFnData>,
      TVariables,
      TPageParam
    >
  : T extends MutationHook<infer TFnData, infer TVariables, infer TError>
  ? MutationHookOptions<TFnData, TError, TVariables, unknown>
  : never

export type inferCreateOptions<T> = T extends QueryHook<
  infer TFnData,
  infer TVariables,
  infer TError
>
  ? CreateQueryOptions<TFnData, TVariables, TError>
  : T extends SuspenseQueryHook<infer TFnData, infer TVariables, infer TError>
  ? CreateSuspenseQueryOptions<TFnData, TVariables, TError>
  : T extends InfiniteQueryHook<
      infer TFnData,
      infer TVariables,
      infer TError,
      infer TPageParam
    >
  ? CreateInfiniteQueryOptions<TFnData, TVariables, TError, TPageParam>
  : T extends SuspenseInfiniteQueryHook<
      infer TFnData,
      infer TVariables,
      infer TError,
      infer TPageParam
    >
  ? CreateSuspenseInfiniteQueryOptions<TFnData, TVariables, TError, TPageParam>
  : T extends MutationHook<infer TFnData, infer TVariables, infer TError>
  ? CreateMutationOptions<TFnData, TError, TVariables, unknown>
  : never
