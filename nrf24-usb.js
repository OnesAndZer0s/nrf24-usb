var usb = require("usb");

// USB commands
const TRANSMIT_PAYLOAD = 0x04;
const ENTER_SNIFFER_MODE = 0x05;
const ENTER_PROMISCUOUS_MODE = 0x06;
const ENTER_TONE_TEST_MODE = 0x07;
const TRANSMIT_ACK_PAYLOAD = 0x08;
const SET_CHANNEL = 0x09;
const GET_CHANNEL = 0x0A;
const ENABLE_LNA_PA = 0x0B;
const TRANSMIT_PAYLOAD_GENERIC = 0x0C;
const ENTER_PROMISCUOUS_MODE_GENERIC = 0x0D;
const RECEIVE_PAYLOAD = 0x12;

// to help sanity
let logging = true;

// nRF24LU1+ registers
const RF_CH = 0x05;

// RF data rates
const RF_RATE_250K = 0;
const RF_RATE_1M = 1;
const RF_RATE_2M = 2;

class nrf24 {

    // constructor
    constructor() {
        this.dongle = usb.findByIds(0x1915, 0x0102) || null;
        if ((this.dongle == null)) { throw new Error("Cannot find USB Dongle"); }
        this.dongle.open();
        this.interface = this.dongle.interface(0);
        this.interface.claim();
        this.end = this.interface.endpoint(0x01);
    }

    // Send a USB command
    send_usb_command(request, data) {
        data = [request].concat([...data]);
        this.interface.endpoint(0x01).transfer(data, () => console.log);
        //this.dongle.controlTransfer(0x01,data)
    }

    // Put the radio in pseudo-promiscuous mode
    enter_promiscuous_mode(prefix = []) {
        this.send_usb_command(ENTER_PROMISCUOUS_MODE, [prefix.length].concat(prefix));
        return new Promise((resolve, reject) => {
            this.interface.endpoint(0x81).transfer(64, (err, dat) => {
                if (err) { reject(err); } else { resolve(dat); }
            });
        });
    }
    // Put the radio in pseudo-promiscuous mode without CRC checking
    enter_promiscuous_mode_generic(prefix = [], rate = RF_RATE_2M) {
        this.send_usb_command(ENTER_PROMISCUOUS_MODE_GENERIC, [prefix.length, rate].concat(prefix));
        return new Promise((resolve, reject) => {
            this.interface.endpoint(0x81).transfer(64, (err, dat) => {
                if (err) { reject(err); } else { resolve(dat); }
            });
        });
    }

    // Put the radio in ESB "sniffer" mode (ESB mode w/o auto-acking)
    enter_sniffer_mode(address) {
        this.send_usb_command(ENTER_SNIFFER_MODE, [address.length].concat(address));
        return new Promise((resolve, reject) => {
            this.interface.endpoint(0x81).transfer(64, (err, dat) => {
                if (err) { reject(err); } else { resolve(dat); }
            });
        });
    }

    // Put the radio into continuous tone (TX) test mode
    enter_tone_test_mode() {
        this.send_usb_command(ENTER_TONE_TEST_MODE, []);
        return new Promise((resolve, reject) => {
            this.interface.endpoint(0x81).transfer(64, (err, dat) => {
                if (err) { reject(err); } else { resolve(dat); }
            });
        });
    }

    // Receive a payload if one is available
    receive_payload() {
        this.send_usb_command(RECEIVE_PAYLOAD, []);
        return new Promise((resolve, reject) => {
            this.interface.endpoint(0x81).transfer(64, (err, dat) => {
                if (err) { reject(err); } else { resolve(dat); }
            });
        });
    }

    // Transmit a generic (non-ESB) payload
    transmit_payload_generic(payload, address = [0x33, 0x33, 0x33, 0x33, 0x33]) {
        data = [payload.length, address.length].concat([payload,address]);
        this.send_usb_command(TRANSMIT_PAYLOAD_GENERIC, data);
        return new Promise((resolve, reject) => {
            this.interface.endpoint(0x81).transfer(64, (err, dat) => {
                if (err) { reject(err); } else { resolve(dat); }
            });
        });
    }

    // Transmit an ESB payload
    transmit_payload(payload, timeout = 4, retransmits = 15) {
        data = [payload.length, timeout, retransmits].concat(payload);
        this.send_usb_command(TRANSMIT_PAYLOAD, data);
        return new Promise((resolve, reject) => {
            this.interface.endpoint(0x81).transfer(64, (err, dat) => {
                if (err) { reject(err); } else { resolve(dat); }
            });
        });
    }

    // Transmit an ESB ACK payload
    transmit_ack_payload(payload) {
        data = [payload.length].concat(payload);
        this.send_usb_command(TRANSMIT_ACK_PAYLOAD, data);
        return new Promise((resolve, reject) => {
            this.interface.endpoint(0x81).transfer(64, (err, dat) => {
                if (err) { reject(err); } else { resolve(dat); }
            });
        });
    }

    // Set the RF channel
    set_channel(channel) {
        if (channel > 125) { channel = 125; }
        this.send_usb_command(SET_CHANNEL, [channel]);
        return new Promise((resolve, reject) => {
            this.interface.endpoint(0x81).transfer(64, (err, dat) => {
                if (err) { reject(err); } else { resolve(dat); }
            });
        }); //logging.debug('Tuned to {0}'.format(channel))
    }


    // Get the current RF channel
    get_channel() {
        this.send_usb_command(GET_CHANNEL, []);
        return new Promise((resolve, reject) => {
            this.interface.endpoint(0x81).transfer(64, (err, dat) => {
                if (err) { reject(err); } else { resolve(dat); }
            });
        });
    }

    // Enable the LNA (CrazyRadio PA)
    enable_lna() {
        this.send_usb_command(ENABLE_LNA_PA, []);
        return new Promise((resolve, reject) => {
            this.interface.endpoint(0x81).transfer(64, (err, dat) => {
                if (err) { reject(err); } else { resolve(dat); }
            });
        });
    }
}

module.exports = nrf24;