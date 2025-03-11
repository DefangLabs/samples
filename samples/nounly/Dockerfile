# syntax=docker/dockerfile:1.4
ARG GOVERSION=1.22
ARG BASE=busybox # for wget healtcheck

FROM --platform=${BUILDPLATFORM} golang:${GOVERSION} AS build
# These two are automatically set by docker buildx
ARG TARGETARCH
ARG TARGETOS
WORKDIR /src
COPY --link go.mod go.sum* ./
ARG GOPRIVATE=github.com/lionello/nounly-go
RUN go mod download
ARG GOSRC=.
COPY --link ${GOSRC} ./
# RUN go test -v ./... FIXME: "no required module provides package github.com/defang-io/defang-mvp/fabric/internal/util_test"
ARG BUILD=./cmd/server
ARG VERSION
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -trimpath -buildvcs=false -ldflags="-w -s -X \"main.version=${VERSION}\"" -o /server "${BUILD}"

FROM --platform=${TARGETPLATFORM} ${BASE}
# RUN apk add --update curl ca-certificates && rm -rf /var/cache/apk* # Certificates for SSL
ARG PORT=80
ENV PORT=$PORT
# ENV REPLICAS=1
COPY --link --from=build /server /server
COPY --link ./public /public
ENTRYPOINT [ "/server" ]
EXPOSE $PORT
# USER nobody
