import React, { RefObject, SyntheticEvent } from "react";
import { FieldProps } from "react-jsonschema-form";
import { decrypt, encrypt } from "../../../../common/crypto";
import { ISecureString } from "../../../../models/applicationState";

/**
 * Protected input properties
 * @member value - The value to bind to the component
 * @member securityToken - Optional value used to encrypt/decrypt the value
 */
export interface IProtectedInputProps extends FieldProps {
    value: string | ISecureString;
    securityToken?: string;
}

/** Protected input state
 * @member showKey - Whether or not the input field renders as text or password field type
 * @member decryptedValue - The decrypted value to bind to the input field
 */
export interface IProtectedInputState {
    showKey: boolean;
    decryptedValue: string;
}

/**
 * Protected input Component
 * @description - Used for sensitive fields such as passwords, keys, tokens, etc
 */
export class ProtectedInput extends React.Component<IProtectedInputProps, IProtectedInputState> {
    private inputElement: RefObject<HTMLInputElement> = React.createRef<HTMLInputElement>();

    constructor(props) {
        super(props);

        this.state = {
            showKey: false,
            decryptedValue: this.getDecryptedValue(),
        };

        this.toggleKeyVisibility = this.toggleKeyVisibility.bind(this);
        this.copyKey = this.copyKey.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    public componentDidMount() {
        this.props.onChange(this.props.value);
    }

    public render() {
        const { id, readonly } = this.props;
        const { showKey, decryptedValue } = this.state;

        return (
            <div className="input-group">
                <input id={id}
                    ref={this.inputElement}
                    type={showKey ? "text" : "password"}
                    readOnly={readonly}
                    className="form-control"
                    value={decryptedValue}
                    onChange={this.onChange} />
                <div className="input-group-append">
                    <button type="button"
                        title={showKey ? "Hide" : "Show"}
                        className="btn btn-primary"
                        onClick={this.toggleKeyVisibility}>
                        <i className={showKey ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                    </button>
                    <button type="button"
                        title="Copy"
                        className="btn btn-primary"
                        onClick={this.copyKey}>
                        <i className="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        );
    }

    private getDecryptedValue(): string {
        const secureString = this.props.value as ISecureString;
        if (this.props.securityToken && secureString && secureString.encrypted) {
            return decrypt(secureString.encrypted, this.props.securityToken);
        }

        return this.props.value as string;
    }

    private onChange(e: SyntheticEvent) {
        const input = e.target as HTMLInputElement;
        let value: string | ISecureString = input.value;
        if (this.props.securityToken) {
            value = {
                encrypted: encrypt(input.value, this.props.securityToken),
            };
        }

        this.props.onChange(value ? value : undefined);
    }

    private toggleKeyVisibility() {
        this.setState({
            showKey: !this.state.showKey,
        });
    }

    private async copyKey() {
        const clipboard = (navigator as any).clipboard;
        await clipboard.writeText(this.inputElement.current.value);
    }
}
