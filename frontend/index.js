import { initializeBlock, useGlobalConfig,FormField,Input,useBase,useRecords } from '@airtable/blocks/ui';
import React,{useState,useEffect} from 'react';
import { Button } from '@airtable/blocks/ui';
import './styles.css'

const App = () => {
    const base = useBase();
    const globalConfig = useGlobalConfig();
  const [accessToken, setAccessToken] = useState(globalConfig.get('accessToken') || '');
  const [tableId, setTableId] = useState("");
  const [emailFieldId, setEmailFieldId] = useState("");
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState("");
    const table = base.getTableByIdIfExists(tableId);
  const records = useRecords(table);
    const [status, setStatus] = useState('');

    // const AUTH_GOOGLE_URL = 'https://airtablemailerbackend.onrender.com/auth/google';
    // const SEND_EMAIL_API = 'https://airtablemailerbackend.onrender.com/send-emails';
    // const LOG_OUT_URL = 'https://airtablemailerbackend.onrender.com/logout';

    const AUTH_GOOGLE_URL = 'http://localhost:3000/auth/google';
    const SEND_EMAIL_API = 'http://localhost:3000/send-emails';
    const LOG_OUT_URL = 'http://localhost:3000/logout';

    useEffect(() => {
      const handleMessage = (event) => {
          if (event.origin === 'http://localhost:3000') { // Change this to your deployed backend URL
              const accessToken = event.data;
              setAccessToken(accessToken);
              globalConfig.setAsync('accessToken', accessToken);
          }
      };

      window.addEventListener('message', handleMessage);

      return () => {
          window.removeEventListener('message', handleMessage);
      };
  }, [globalConfig]);

    const handleAuthorize = () => {
        window.open(AUTH_GOOGLE_URL, 'google-auth-popup', 'width=500,height=600');
    };

    const handleSendEmails = async () => {
        try {
            const accessToken = globalConfig.get('accessToken');
            const emails = records.map(record => ({
              email: record.getCellValue(emailFieldId),
              fields: table.fields.reduce((acc, field) => {
                  acc[field.name] = record.getCellValue(field.id);
                  return acc;
              }, {})
          }));
            console.log("{accessToken, emails,subject, message } : ",{accessToken, emails,subject, message });
                
            const response = await fetch(SEND_EMAIL_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessToken, emails, subject, message }),
            });

            const data = await response.json();
            if (data.success) {
                alert('Emails sent successfully!');
            } else {
                alert('Error sending emails: ' + data.message);
            }
        } catch (error) {
            alert('Error sending emails: ' + error.message);
        }
    };


    const handleLogout = async () => {
      try {
          const response = await fetch(LOG_OUT_URL, {
              method: 'GET',
              credentials: 'include'
          });

          if (response.ok) {
              // Clear tokens from global config
              await globalConfig.setAsync('accessToken', null);
              alert('Logged out successfully!');
              window.location.reload();
          } else {
              alert('Failed to logout');
          }
      } catch (error) {
          alert('Error logging out: ' + error.message);
      }
  };

    return (
        <div>
          <h2>Airtable Mailer</h2>
          <h3>Send Personalised Emails</h3>
            <Button onClick={handleAuthorize} variant="primary">
                Authorize
            </Button>
            <Button onClick={handleLogout} variant="danger">
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
            placeholder="Write your message here. Use {firstName} and {lastName} for personalization."
          />
          </FormField>
        </div>
        <Button onClick={handleSendEmails} variant="primary">
           Send Emails
         </Button>
         {status && <Text marginTop={2} textColor="red">{status}</Text>}
        </div>
    );
};

initializeBlock(() => <App />);
