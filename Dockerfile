FROM golang:alpine as builder
RUN mkdir /app
WORKDIR /app
COPY go.mod .
COPY go.sum .
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -o /go/bin/hanko-webauthn-quickstart

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /go/bin/hanko-webauthn-quickstart .
COPY templates ./templates
COPY assets ./assets
COPY config ./config
CMD ["./hanko-webauthn-quickstart"]
