import {
  initializeBlock,
  useBase,
  useRecords,
  Button,
  Input,
  useGlobalConfig,
  FormField,
  Text
} from "@airtable/blocks/ui";
import React, { useState,useEffect } from "react";
import "./styles.css";

function EmailSenderBlock() {
  const base = useBase();
  const globalConfig = useGlobalConfig();
  const [tableId, setTableId] = useState("");
  const [emailFieldId, setEmailFieldId] = useState("");
  const [firstNameFieldId, setFirstNameFieldId] = useState("");
  const [lastNameFieldId, setLastNameFieldId] = useState("");
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tokens, setTokens] = useState(null);
  const [accessToken, setAccessToken] = useState(globalConfig.get('accessToken') || '');
  const table = base.getTableByIdIfExists(tableId);
  const records = useRecords(table);
  const [status, setStatus] = useState('');

  const handleAuthorize = () => {
    window.open("http://localhost:8000", "_blank");
  };


  const handleSendEmails = async () => {
try{

    const emails = records.map((record) => ({
      email: record.getCellValue(emailFieldId),
      firstName: record.getCellValue(firstNameFieldId),
      lastName: record.getCellValue(lastNameFieldId),
    }));
    console.log("{accessToken, emails,subject, message } : ",{accessToken, emails,subject, message });

    const response = await fetch("http://localhost:3000/send-emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({accessToken, emails,subject, message }),
    });

    if (response.ok) {
      alert("Emails sent successfully!");
      setStatus('Emails sent successfully!');
    } else {
      alert("Failed to send emails.");
      setStatus('Failed to send emails: ' + result.message);
    }
    
}
catch(err){
  setStatus('Error: ' + err.message);
}
  };

  return (
      <div>
        <h1>Send Emails</h1>
        <Button onClick={handleAuthorize} variant="primary">
          Authorize
        </Button>
        <FormField label="Access Token">
                <Input
                    value={accessToken}
                    onChange={e => {
                        setAccessToken(e.target.value);
                        globalConfig.setAsync('accessToken', e.target.value);
                    }}
                />
            </FormField>
        <div>
          <label>Select Table:</label>
          <select onChange={(e) => setTableId(e.target.value)}>
            <option value="">Select</option>
            {base.tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
        </div>
        {table && (
          <div>
            <label>Select Email Column:</label>
            <select onChange={(e) => setEmailFieldId(e.target.value)}>
              <option value="">Select</option>
              {table.fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
            <label>Select First Name Column:</label>
            <select onChange={(e) => setFirstNameFieldId(e.target.value)}>
              <option value="">Select</option>
              {table.fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
            <label>Select Last Name Column:</label>
            <select onChange={(e) => setLastNameFieldId(e.target.value)}>
              <option value="">Select</option>
              {table.fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label>Subject:</label>
          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Write your subject here."
          />
        </div>
        <div>
          <label>Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here. Use {firstName} and {lastName} for personalization."
          />
        </div>
        <Button onClick={handleSendEmails} variant="primary">
          Send Emails
        </Button>
        {status && <Text marginTop={2} textColor="red">{status}</Text>}
      </div>
  );
}

initializeBlock(() => <EmailSenderBlock />);
