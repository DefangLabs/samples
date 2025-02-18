FROM mcp/time:latest

WORKDIR /wrapper

COPY requirements.txt ./requirements.txt

# create a virtual environment
RUN python3 -m venv venv && \
    # activate the virtual environment
    . venv/bin/activate && \
    pip3 install --upgrade pip && \
    pip3 install -r requirements.txt && \
    # deactivate the virtual environment
    deactivate

COPY . .

ENTRYPOINT ["./run.sh"]