import {initializeBlock, useBase, useRecords, Button, Input} from '@airtable/blocks/ui';
import React, {useState} from 'react';
import './styles.css';

function EmailSenderBlock() {
    const base = useBase();
    const [tableId, setTableId] = useState('');
    const [emailFieldId, setEmailFieldId] = useState('');
    const [firstNameFieldId, setFirstNameFieldId] = useState('');
    const [lastNameFieldId, setLastNameFieldId] = useState('');
    const [message, setMessage] = useState('');

    const table = base.getTableByIdIfExists(tableId);
    const records = useRecords(table);

    const handleSendEmails = async () => {
        const emails = records.map(record => ({
            email: record.getCellValue(emailFieldId),
            firstName: record.getCellValue(firstNameFieldId),
            lastName: record.getCellValue(lastNameFieldId),
        }));

        const response = await fetch('http://localhost:3000/send-emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({emails, message}),
        });

        if (response.ok) {
            alert('Emails sent successfully!');
        } else {
            alert('Failed to send emails.');
        }
    };

    return (
        <div>
            <h1>Send Emails</h1>
            <div>
                <label>Select Table:</label>
                <select onChange={e => setTableId(e.target.value)}>
                    <option value="">Select</option>
                    {base.tables.map(table => (
                        <option key={table.id} value={table.id}>{table.name}</option>
                    ))}
                </select>
            </div>
            {table && (
                <div>
                    <label>Select Email Column:</label>
                    <select onChange={e => setEmailFieldId(e.target.value)}>
                        <option value="">Select</option>
                        {table.fields.map(field => (
                            <option key={field.id} value={field.id}>{field.name}</option>
                        ))}
                    </select>
                    <label>Select First Name Column:</label>
                    <select onChange={e => setFirstNameFieldId(e.target.value)}>
                        <option value="">Select</option>
                        {table.fields.map(field => (
                            <option key={field.id} value={field.id}>{field.name}</option>
                        ))}
                    </select>
                    <label>Select Last Name Column:</label>
                    <select onChange={e => setLastNameFieldId(e.target.value)}>
                        <option value="">Select</option>
                        {table.fields.map(field => (
                            <option key={field.id} value={field.id}>{field.name}</option>
                        ))}
                    </select>
                </div>
            )}
            <div>
                <label>Message:</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message here. Use {firstName} and {lastName} for personalization." />
            </div>
            <Button onClick={handleSendEmails} variant="primary">Send Emails</Button>
        </div>
    );
}

initializeBlock(() => <EmailSenderBlock />);
