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

import { isQueryMethod, MutationMethod, MutationService, QueryMethod, QueryService, Schema } from '@typerpc/schema'
import { capitalize, lowerCase } from '@typerpc/plugin-utils'
import { buildInterfaceMethods, buildType, buildTypes } from '@typerpc/go-plugin-utils'

const buildClientStruct = (svc: QueryService | MutationService): string => {
    return `
type ${capitalize(svc.name)} struct {
	client *resty.Client
	baseUrl string
  ${buildInterfaceMethods(svc.methods)}
}

func New${capitalize(svc.name)}(host string) (*${svc.name}, error)  {
	_, err := url2.ParseRequestURI(host)
	if err != nil {
		return nil, err
	}
	return &${capitalize(svc.name)}{
		client: resty.New(),
		baseUrl: fmt.Sprintf("%s/${lowerCase(svc.name)}", host),
	}, nil
}

func (s *${capitalize(svc.name)}) reqUrl(url string) string  {
	return s.baseUrl + "/" + url
}
`
}

const buildQueryRequest = (method: QueryMethod): string => {
    return `
resp, err := s.client.R().Se  `
}
const buildMethod = (method: QueryMethod | MutationMethod): string => {
    if (isQueryMethod(method)) {
    }
    return `
func (s *ExampleServiceClient) GetUserById(ctx context.Context, id int8) (*User, error) {

}
`
}

const buildFile = (schema: Schema): string => {
    return `
package ${schema.packageName}

import "github.com/go-resty/resty"

${buildTypes(schema.messages)}

`
}
