/*
 * Copyright (c) 2020. Gary Becks - <techstar.dev@hotmail.com>
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { PropertySignature, SourceFile, TypeAliasDeclaration, TypeNode } from 'ts-morph'
import { isMsgLiteral, isValidDataType, singleValidationErr } from './utils'
import { parseMessages, parseMsgProps } from '../parser'

const validateProp = (prop: PropertySignature): Error[] =>
    isValidDataType(prop.getTypeNode())
        ? []
        : [
              singleValidationErr(
                  prop,
                  'Invalid property type, Only messages imported location @typerpc/messages, rpc.Msg messages, and other rpc.Msg messages declared in the same file may be used as property messages',
              ),
          ]

const validateMsgProps = (props: PropertySignature[]): Error[] => {
    let errs: Error[] = []
    for (const prop of props) {
        const type = prop.getTypeNode()
        // if the property is a message literal, call validateMsgProps
        // recursively
        if (typeof type !== 'undefined' && isMsgLiteral(type)) {
            errs = errs.concat(validateMsgProps(parseMsgProps(type)))
        }
        errs = errs.concat(validateProp(prop))
    }
    return errs
}

export const validateMessage = (msg: TypeAliasDeclaration | TypeNode): Error[] => {
    if (parseMsgProps(msg).length === 0) {
        return [singleValidationErr(msg, 'Message has no properties. Empty messages are not allowed.')]
    }
    return validateMsgProps(parseMsgProps(msg))
}

export const validateMessages = (file: SourceFile): Error[] =>
    parseMessages(file).flatMap((msg) => validateMessage(msg))
