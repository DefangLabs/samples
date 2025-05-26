import React, { Fragment, useState } from "react";

const Input = () => {
  const [description, setDescription] = useState("");

  const onSubmitForm = async event => {
    event.preventDefault();
    // Prevents the browser from performing default form submission.
    try {
      const body = { description };
      const response = await fetch(`${process.env.REACT_APP_API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      window.location = "/";
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <Fragment>
      <h1 className="text-center mt-5" style={{ textAlign: 'center'}}>Your Todo List</h1>
      <form className="d-flex mt-5" onSubmit={onSubmitForm}>
        <input
          type="text"
          className="form-control"
          value={description}
          onChange={event => setDescription(event.target.value)}
        />
        <button className="btn btn-success">Add</button>
      </form>
    </Fragment>
  );
};

export default Input;