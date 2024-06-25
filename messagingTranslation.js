import { LightningElement, track , api, wire } from 'lwc';
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import STATUS_FIELD from "@salesforce/schema/MessagingSession.Status";

import {
  MessageContext,
  subscribe,
  unsubscribe,
  APPLICATION_SCOPE
} from "lightning/messageService";
import Image from '@salesforce/resourceUrl/Translation_studio';

import lightning__conversationEndUserMessage from "@salesforce/messageChannel/lightning__conversationEndUserMessage";
import lightning__conversationAgentSend from "@salesforce/messageChannel/lightning__conversationAgentSend";

export default class MessagingTranslation extends  LightningElement {
    @api recordId;
    @track inputValue = '';
    @track showSendButton = false;
    @track isDisabled = false; 
    @track value = '';
    messageVisibility = {};
    @track translationActiveIcon = Image + '/TS_Translation_studio/translationActiveIconPng.png' ;//'/TS_Translation_studio/lightning_icon_1.svg';
    @track translationInactiveIcon = Image + '/TS_Translation_studio/translationInactiveIcon.svg';
    @track chevronRightIcon =  Image + '/TS_Translation_studio/chevronRight.svg';
    @track chevronUpIcon =  Image + '/TS_Translation_studio/chevronUp.svg';

    @track imageIcon1 =  Image + '/TS_Translation_studio/translation_language_icon';
    imageIcon2 = Image + '/TS_Translation_studio/lightning_icon_2.png';

    messagingSessionStatusField;
    
    @wire(MessageContext)
    messageContext;

    @track receivedMessages = [];
    chatwindow = true;
    audio;
    conversationEndUserMessage;

    @wire(getRecord, {
        recordId: '$recordId',
        fields: [STATUS_FIELD],
    })
    MessagingSession;

    get status() {
        this.messagingSessionStatusField = getFieldValue(this.MessagingSession.data, STATUS_FIELD);
        if(this.messagingSessionStatusField == 'Active'){
            return true
        } else{
            return false;
        }
        
    }

    connectedCallback() {
        this.conversationEndUserMessage = subscribe(
            this.messageContext,
            lightning__conversationEndUserMessage,
            (message) => {
                let messageType = 'Customer'; 
                this.addNewMessage(message, false);
            },
            { scope: APPLICATION_SCOPE }
        );

        this.conversationAgentSend = subscribe(
            this.messageContext,
            lightning__conversationAgentSend,
            (message) => {
                let messageType = 'Agent'; 
                this.addNewMessage(message, true);
            },
            { scope: APPLICATION_SCOPE }
        );
    }

    addNewMessage(
            messageDetails,
            isAgentMessage
        ) {
            this.handleMessage(messageDetails, isAgentMessage);
    }

    handleMessage(message, isAgentMessage) {
        let messageDetails = message;
        if (messageDetails.content && messageDetails.timestamp) {
            this.receivedMessages.push({
                content: messageDetails.content,
                timestamp: this.twelveHourFormat(messageDetails.timestamp),
                name: messageDetails.name,
                recordId: messageDetails.recordId,
                type: messageDetails.type,
                uniqueKey: messageDetails.timestamp,
                isAgent: isAgentMessage,
                isCustomer: !isAgentMessage,
                isTranslated: false,
                inboundedLabel: 'Show'
            });
            this.scrollToBottom();
        }

        this.receivedMessages = [...this.receivedMessages];
    }

    toggleInboundMessage(event) {
        const key = event.currentTarget.dataset.key;
        const message = this.receivedMessages.find(msg => JSON.parse(msg.uniqueKey) === JSON.parse(key));
        if (message) {
            message.isTranslated = !message.isTranslated;
            message.inboundedLabel = message.isTranslated ? 'Hide ' : 'Show';
            this.receivedMessages = [...this.receivedMessages];
        }
        event.stopPropagation(); 
    }

    get options(){
         return [
            { label: 'Hindi', value: 'Hindi' },
            { label: 'English (Uk)', value: 'English-uk' },
            { label: 'Spanish', value: 'spanish' },
        ];
    }

    handleChange(e){
        this.value = e.target.value;
    }
    
    // Scroll to the bottom of the chat container 
    scrollToBottom() {
      
        const chatContainer = this.template.querySelector('.chat-component');
        if (chatContainer) {
            window.requestAnimationFrame(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight ;
            });
        }
    }

    handleInputChange(event) {
        this.inputValue = event.target.value;
        this.showSendButton = this.inputValue.trim() !== ''; 
    }

    get buttonContainerClass (){
        return this.showSendButton === true ? 'button-container' : 'custom-send-btn' ;
    }

    // Function when we performing 
    async handleButtonClick(event){
        const toolKit = this.refs.lwcToolKitApi;
        let result;

        switch (event.target.value) {
            case 'sendTextMessage':
                result = await toolKit.sendTextMessage(this.recordId, { text: this.inputValue });
                this.inputValue = '';
                this.handleInputFocus();  
                this.scrollToBottom();
                break;
           case 'endConversation':
                result = await toolKit.endConversation(this.recordId);
                this.isDisabled = true;
                break;
               
        } 
       
    }

    handleInputFocus() {
    this.showSendButton = this.inputValue.trim() !== ''; // Show button if there is any input when input is focused
    }

    handleInputBlur() {
        if (this.inputValue.trim() === '') {
            this.showSendButton = false; // Hide button if there is no input when input loses focus
        }
    }


    translatedOutboundMessage = 'Hola Andy, mi nombre es Amber y puedo ayudarte a resolver tu problema.';
    originalOutboundMessage = 'Hi Andy, my name is Amber and I can help you solve your issue.';

    translatedInboundMessage = 'Hola, estoy buscando unas luces que cambien de color para una fiesta que haré el próximo fin de semana.';
    originalInboundMessage = 'Hi, I am looking for some color changing lights for a party I am having next weekend.';

    handleChatButton(){
        alert("Hey there !!! ")
    }


    handleCollapseButtom(e){
        this.chatwindow = !this.chatwindow; 
        this.scrollToBottom();
    }
    
    get translationIcon(){
        return this.chatwindow? this.translationActiveIcon:this.translationInactiveIcon;
    }
    
    twelveHourFormat = (dateString) => {
        const date = new Date(dateString);
        const options = { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    };
}