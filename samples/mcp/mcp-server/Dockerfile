FROM mcp/time:latest

WORKDIR /wrapper

COPY requirements.txt ./requirements.txt

# create a virtual environment
RUN python3 -m venv venv
# activate the virtual environment
RUN . venv/bin/activate
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
# deactivate the virtual environment
RUN exit

COPY . .

ENTRYPOINT ["./run.sh"]