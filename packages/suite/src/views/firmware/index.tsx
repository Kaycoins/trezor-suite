import React from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ConfirmOnDevice } from '@trezor/components';

import * as firmwareActions from '@firmware-actions/firmwareActions';
import * as routerActions from '@suite-actions/routerActions';
import { InjectedModalApplicationProps, Dispatch, AppState } from '@suite-types';
import {
    InitialStep,
    CheckSeedStep,
    FirmwareProgressStep,
    PartiallyDoneStep,
    DoneStep,
    ErrorStep,
    ReconnectInBootloaderStep,
    ReconnectInNormalStep,
    NoNewFirmware,
    Buttons,
    CloseButton,
    ContinueButton,
} from '@firmware-components';
import { DeviceAcquire, DeviceUnknown, DeviceUnreadable } from '@suite-views';
import { Translation, Modal } from '@suite-components';

const InnerModalWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const mapStateToProps = (state: AppState) => ({
    firmware: state.firmware,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            closeModalApp: routerActions.closeModalApp,
            resetReducer: firmwareActions.resetReducer,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapDispatchToProps> &
    ReturnType<typeof mapStateToProps> &
    InjectedModalApplicationProps;

const Firmware = ({ closeModalApp, resetReducer, firmware, device, modal }: Props) => {
    const onClose = () => {
        closeModalApp();
        resetReducer();
    };

    const stepsInProgressBar = [
        'initial',
        'check-seed',
        'waiting-for-bootloader',
        'started',
        'waiting-for-confirmation',
        'installing',
        ['wait-for-reboot', 'unplug'],
        'reconnect-in-normal', // maybe rename "reconnect-after-install" ?
        ['done', 'partially-done', 'error'],
    ];

    const getCurrentStepIndex = () => {
        return stepsInProgressBar.findIndex(s => {
            if (Array.isArray(s)) {
                return s.includes(firmware.status);
            }
            return s === firmware.status;
        });
    };

    // some of the application states can be reused here.
    // some don't make sense handling here as they are handled somewhere up the tree
    // some must be handled in lower layers because of specifics of fw update process (eg. device-disconnected)
    const getSuiteApplicationState = () => {
        if (!device) return;
        // device features cannot be read, device is probably used in another window
        if (device.type === 'unacquired') return DeviceAcquire;
        // Webusb unreadable device (HID)
        if (device.type === 'unreadable') return DeviceUnreadable;
        // device features unknown (this shouldn't happened tho)
        if (!device.features) return DeviceUnknown;
    };

    // standalone firmware update has 2 heading variants
    const CommonHeading = () => {
        const nextVersion =
            // device?.firmwareRelease?.release.version.join('.') ||
            firmware.targetRelease?.release.version.join('.');
        return <Translation id="FIRMWARE_UPDATE_TO_VERSION" values={{ version: nextVersion }} />;
    };

    const getComponent = () => {
        // edge case 1 - error
        if (firmware.error) {
            return {
                Heading: <ErrorStep.Heading />,
                Body: <ErrorStep.Body />,
                BottomBar: <CloseButton onClick={onClose} />,
            };
        }

        // edge case 2 - user has reconnected device that is already up to date
        if (firmware.status !== 'done' && device?.firmware === 'valid') {
            return {
                Heading: <NoNewFirmware.Heading />,
                Body: <NoNewFirmware.Body />,
                BottomBar: <CloseButton onClick={onClose} />,
            };
        }

        switch (firmware.status) {
            case 'initial':
                return {
                    Heading: <InitialStep.Heading />,
                    Body: <InitialStep.Body />,
                    BottomBar: <InitialStep.BottomBar />,
                };
            case 'check-seed':
                return {
                    Heading: <CommonHeading />,
                    Body: <CheckSeedStep.Body />,
                    BottomBar: <CheckSeedStep.BottomBar />,
                };
            case 'waiting-for-bootloader':
                return {
                    Heading: <CommonHeading />,
                    Body: <ReconnectInBootloaderStep.Body />,
                    BottomBar: <ReconnectInBootloaderStep.BottomBar />,
                };
            case 'waiting-for-confirmation':
            case 'installing':
            case 'started':
            case 'wait-for-reboot':
            case 'unplug':
                return {
                    Heading: <CommonHeading />,
                    Body: <FirmwareProgressStep.Body />,
                    BottomBar: null,
                };
            case 'reconnect-in-normal':
                return {
                    Heading: <CommonHeading />,
                    Body: <ReconnectInNormalStep.Body />,
                    BottomBar: <ReconnectInNormalStep.BottomBar />,
                };
            case 'partially-done':
                return {
                    Heading: <CommonHeading />,
                    Body: <PartiallyDoneStep.Body />,
                    BottomBar: <ContinueButton onClick={resetReducer} />,
                };
            case 'done':
                return {
                    Heading: <DoneStep.Heading />,
                    Body: <DoneStep.Body />,
                    BottomBar: <CloseButton onClick={onClose} />,
                };

            default:
                // should never get here
                throw new Error('state is not handled here');
        }
    };

    const Component = getComponent();

    if (!Component) return null;

    const ApplicationStateModal = getSuiteApplicationState();

    if (ApplicationStateModal) return <ApplicationStateModal />;

    // todo: we really need to have finally designs on how to display these button requests when
    // there is a modal active, I could either replace the main content, or display it as a nested modal?
    // if (modal) {
    //     return (<Modal>
    //         <InnerModalWrapper>
    //             {modal}
    //         </InnerModalWrapper>
    //     </Modal>
    //     )
    // }

    return (
        <Modal
            cancelable={[
                'initial',
                'check-seed',
                'done',
                'partially-done',
                'waiting-for-bootloader',
                'error',
            ].includes(firmware.status)}
            header={
                firmware.status === 'waiting-for-confirmation' && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        trezorModel={device?.features?.major_version === 1 ? 1 : 2}
                        animated
                    />
                )
            }
            onCancel={onClose}
            useFixedHeight
            data-test="@firmware/index"
            heading={Component.Heading}
            bottomBar={!modal && <Buttons>{Component.BottomBar}</Buttons>}
            totalProgressBarSteps={stepsInProgressBar.length}
            currentProgressBarStep={getCurrentStepIndex()}
            hiddenProgressBar={false}
        >
            {modal ? <InnerModalWrapper>{modal}</InnerModalWrapper> : Component.Body}
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Firmware);
