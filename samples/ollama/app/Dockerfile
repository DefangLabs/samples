FROM ubuntu:22.04

# install curl
RUN apt-get update && apt-get install -y curl && apt-get clean

# create ollama user and group
RUN groupadd -r ollama && useradd -r -g ollama ollama

RUN curl -fsSL https://ollama.com/install.sh | sh

COPY ./run /run

USER ollama

CMD ["/run"]