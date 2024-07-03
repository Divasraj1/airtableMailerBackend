import {
  initializeBlock,
  useGlobalConfig,
  FormField,
  Input,
  useBase,
  useRecords,
} from "@airtable/blocks/ui";
import React, { useState, useEffect } from "react";
import { Button } from "@airtable/blocks/ui";
import mixpanel from "mixpanel-browser";

import "./styles.css";

const App = () => {
  const projectId = "5594501f4f4ffa188f99874a93fe2181";
  mixpanel.init(projectId, { //debug: true,track_pageview: true,
    persistence: "localStorage",
  });
  const base = useBase();
  const globalConfig = useGlobalConfig();
  const [accessToken, setAccessToken] = useState(
    globalConfig.get("accessToken") || ""
  );
  const [tableId, setTableId] = useState("");
  const [emailFieldId, setEmailFieldId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const table = base.getTableByIdIfExists(tableId);
  const records = useRecords(table);
  const [status, setStatus] = useState("");

  const AUTH_GOOGLE_URL =
    "https://airtablemailerbackend.onrender.com/auth/google";
  const SEND_EMAIL_API =
    "https://airtablemailerbackend.onrender.com/send-emails";
  const LOG_OUT_URL = "https://airtablemailerbackend.onrender.com/logout";
  const BACKEND_ORIGIN = "https://airtablemailerbackend.onrender.com";

  // const AUTH_GOOGLE_URL = 'http://localhost:3000/auth/google';
  // const SEND_EMAIL_API = 'http://localhost:3000/send-emails';
  // const LOG_OUT_URL = 'http://localhost:3000/logout';
  // const BACKEND_ORIGIN = 'http://localhost:3000';

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.origin === BACKEND_ORIGIN) {
        // Change this to your deployed backend URL
        const accessToken = event.data;
        setAccessToken(accessToken);
        globalConfig.setAsync("accessToken", accessToken);
        let res = await fetch(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`,
          {
              method: "GET",
              headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: "application/json",
              },
          }
      );
      
      // Check if the response is ok (status code 200-299)
      if (res.ok) {
          let data = await res.json();
          // Use the data as needed, for example:
          const { email, name } = data;
          // Store in global config or use in your app
          globalConfig.setAsync('userEmail', email);
          globalConfig.setAsync('userName', name);

          // Identify user in Mixpanel
          mixpanel.identify(email);
          mixpanel.people.set({
              $email: email,
              $name: name,
          });
      } else {
          console.log("HTTP-Error: " + res.status);
      }
      
      }
    };
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [globalConfig]);

  const handleAuthorize = () => {
    console.log("authorization called");
    mixpanel.track('authorize')
    window.open(AUTH_GOOGLE_URL, "google-auth-popup", "width=500,height=600");
  };

  const handleSendEmails = async () => {
    try {
      mixpanel.track('send email')
      const accessToken = globalConfig.get("accessToken");
      const emails = records.map((record) => ({
        email: record.getCellValue(emailFieldId),
        fields: table.fields.reduce((acc, field) => {
          acc[field.name] = record.getCellValue(field.id);
          return acc;
        }, {}),
      }));
      // console.log("{accessToken, emails,subject, message } : ",{accessToken, emails,subject, message });
      console.log("send email called");
      const response = await fetch(SEND_EMAIL_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken, emails, subject, message }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Emails sent successfully!");
      } else {
        alert("Error sending emails: " + data.message);
      }
    } catch (error) {
      alert("Error sending emails: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      mixpanel.track('logout')
      const response = await fetch(LOG_OUT_URL, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        // Clear tokens from global config
        await globalConfig.setAsync("accessToken", null);
        await globalConfig.setAsync('userEmail', null);
        await globalConfig.setAsync('userName', null);
        alert("Logged out successfully!");
        window.location.reload();
      } else {
        alert("Failed to logout");
      }
    } catch (error) {
      alert("Error logging out: " + error.message);
    }
  };

  return (
    <div style={{ margin: "5px" }}>
      <img src="" />
      <h2>Mail Merge</h2>
      <h3>Send Personalised Mass Emails</h3>
      <Button
        onClick={handleAuthorize}
        variant="primary"
        style={{ marginBottom: "10px" }}
      >
        Authorize
      </Button>
      <Button
        onClick={handleLogout}
        variant="danger"
        style={{ marginLeft: "10px" }}
      >
        Logout
      </Button>

      <div>
        <FormField label="Select Table">
          <select onChange={(e) => setTableId(e.target.value)}>
            <option value="">Select</option>
            {base.tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      {table && (
        <div>
          <FormField label="Select Email Column">
            <select onChange={(e) => setEmailFieldId(e.target.value)}>
              <option value="">Select</option>
              {table.fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      )}
      <div>
        <FormField label="Subject">
          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Write your subject here."
          />
        </FormField>
      </div>

      <div>
        <FormField label="Message">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here. Use {{Name}} and {{CompanyName}} for personalization."
          />
        </FormField>
      </div>
      <Button onClick={handleSendEmails} variant="primary">
        Send Emails
      </Button>
      {status && (
        <Text marginTop={2} textColor="red">
          {status}
        </Text>
      )}
    </div>
  );
};

initializeBlock(() => <App />);
