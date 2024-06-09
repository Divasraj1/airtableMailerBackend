import React, {useState} from 'react';
import {
    useBase,
    useRecords,
    useGlobalConfig,
    expandRecord,
    TablePickerSynced,
    ViewPickerSynced,
    FieldPickerSynced,
    FormField,
    Input,
    Button,
    Box,
    Icon,
} from '@airtable/blocks/ui';
import {FieldType} from '@airtable/blocks/models';

export default function TodoApp() {
    const base = useBase();

    // Read the user's choice for which table and view to use from globalConfig.
    const globalConfig = useGlobalConfig();
    const tableId = globalConfig.get('selectedTableId');
    const viewId = globalConfig.get('selectedViewId');
    const emailFieldId = globalConfig.get('selectedemailFieldId');

    const table = base.getTableByIdIfExists(tableId);
    const view = table ? table.getViewByIdIfExists(viewId) : null;
    const emailField = table ? table.getFieldByIdIfExists(emailFieldId) : null;
    const [message, setMessage] = useState('');
    const records = useRecords(table);

    const handleSendEmails = async () => {
        const emails = records.map(record => ({
            email: record.getCellValue(emailFieldId)
        }));

        console.log("emails : ",emails);

        // const response = await fetch('/send-emails', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({emails, message}),
        // });

        // if (response.ok) {
        //     alert('Emails sent successfully!');
        // } else {
        //     alert('Failed to send emails.');
        // }
    };

    const tasks = records
        ? records.map(record => {
              return <Task key={record.id} record={record} table={table} emailField={emailField} />;
          })
        : null;

    return (
        <div>
            <Box padding={3} borderBottom="thick">
                <h1>Airtable Mailer</h1>
                <h2>Send Email</h2>
                <FormField label="Select Table:">
                    <TablePickerSynced globalConfigKey="selectedTableId" />
                </FormField>
                <FormField label="View">
                    <ViewPickerSynced table={table} globalConfigKey="selectedViewId" />
                </FormField>
                <FormField label="Select Email Field" marginBottom={0}>
                    <FieldPickerSynced
                        table={table}
                        globalConfigKey="selectedemailFieldId"
                        placeholder="Pick a 'Email' field..."
                    />
                </FormField>
            </Box>
            {tasks}
            {table && emailField && <AddTaskForm table={table} />}
            <div>
                <label>Message:</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message here. Use {firstName} and {lastName} for personalization." />
            </div>
            <Button onClick={handleSendEmails} variant="primary">Send Emails</Button>
        </div>
    );
}

function Task({record, table, emailField}) {
    return (
        <Box
            fontSize={4}
            paddingX={3}
            paddingY={2}
            marginRight={-2}
            borderBottom="default"
            display="flex"
            alignItems="center"
        >
            <TaskDoneCheckbox table={table} record={record} emailField={emailField} />
            <a
                style={{cursor: 'pointer', flex: 'auto', padding: 8}}
                onClick={() => {
                    expandRecord(record);
                }}
            >
                {record.name || 'Unnamed record'}
            </a>
            <TaskDeleteButton table={table} record={record} />
        </Box>
    );
}

function TaskDoneCheckbox({table, record, emailField}) {
    function onChange(event) {
        table.updateRecordAsync(record, {
            [emailField.id]: event.currentTarget.checked,
        });
    }

    const permissionCheck = table.checkPermissionsForUpdateRecord(record, {
        [emailField.id]: undefined,
    });

    return (
        <input
            type="checkbox"
            checked={!!record.getCellValue(emailField)}
            onChange={onChange}
            style={{marginRight: 8}}
            disabled={!permissionCheck.hasPermission}
        />
    );
}

function TaskDeleteButton({table, record}) {
    function onClick() {
        table.deleteRecordAsync(record);
    }

    return (
        <Button
            variant="secondary"
            marginLeft={1}
            onClick={onClick}
            disabled={!table.hasPermissionToDeleteRecord(record)}
        >
            <Icon name="x" style={{display: 'flex'}} />
        </Button>
    );
}

function AddTaskForm({table}) {
    const [taskName, setTaskName] = useState('');

    function onInputChange(event) {
        setTaskName(event.currentTarget.value);
    }

    function onSubmit(event) {
        event.preventDefault();
        table.createRecordAsync({
            [table.primaryField.id]: taskName,
        });
        setTaskName('');
    }

    // check whether or not the user is allowed to create records with values in the primary field.
    // if not, disable the form.
    const isFormEnabled = table.hasPermissionToCreateRecord({
        [table.primaryField.id]: undefined,
    });
    return (
        <form onSubmit={onSubmit}>
            <Box display="flex" padding={3}>
                <Input
                    flex="auto"
                    value={taskName}
                    placeholder="New task"
                    onChange={onInputChange}
                    disabled={!isFormEnabled}
                />
                <Button variant="primary" marginLeft={2} type="submit" disabled={!isFormEnabled}>
                    Add
                </Button>
            </Box>
        </form>
    );
}
