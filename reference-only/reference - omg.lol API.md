---
source: https://api.omg.lol/
---

# omg.lol - An amazing API for an amazing service

> ## Excerpt
>
> Beep boop programming stuff

---
The omg.lol API is a modern, RESTful, friendly thing. It offers endpoints to manage all aspects of your omg.lol service, and responses include multiple elements that aim to make life easy for developers (including a clear message that indicates what happened with your request).

Endpoints requiring authentication with your API key are marked as Bearer Token, and endpoints that don’t require authentication are marked as No Auth. Some endpoints work either way, with unauthenticated requests providing public data and authenticated requests to the same endpoint providing private data.

You can grab a machine-readable copy of the API specification in [our GitHub repository](https://github.com/neatnik/omg.lol/tree/main/api).

**Careful!** The API is still being developed, and endpoints may change.

## Account

Obtain information about and make changes to your account

## Account · Retrieve account information

Get information about your account

Bearer Token GET /account/email/info

#### **Retrieve account information**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/account/person@example.com/info'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here is the account info that you requested.",
        "email": "person@example.com",
        "name": "Example",
        "created": {
            "unix_epoch_time": "1553358104",
            "iso_8601_time": "2019-03-23T16:21:44+00:00",
            "rfc_2822_time": "Sat, 23 Mar 2019 16:21:44 +0000",
            "relative_time": "2 years and 9 months ago"
        },
        "settings": {
            "communication": "email_everything"
        }
    }
}
```

## Account · Retrieve addresses for an account

Get all addresses associated with your account.

Bearer Token GET /account/email/addresses

#### **Retrieve addresses for an account**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/account/person@example.com/addresses'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": [
        {
            "address": "lifetime-address",
            "message": "This address does not expire.",
            "registration": {
                "message": "This address was registered 2 years and 11 months ago.",
                "unix_epoch_time": "1553358201",
                "iso_8601_time": "2019-03-23T16:23:21+00:00",
                "rfc_2822_time": "Sat, 23 Mar 2019 16:23:21 +0000",
                "relative_time": "2 years and 11 months ago"
            },
            "expiration": {
                "expired": false,
                "will_expire": false
            }
        },
        {
            "address": "compulsoryvotingiscool",
            "message": "This address does not expire.",
            "registration": {
                "message": "This address was registered 1 week and 4 days ago.",
                "unix_epoch_time": "1645552219",
                "iso_8601_time": "2022-02-22T17:50:19+00:00",
                "rfc_2822_time": "Tue, 22 Feb 2022 17:50:19 +0000",
                "relative_time": "1 week and 4 days ago"
            },
            "expiration": {
                "expired": false,
                "will_expire": false
            }
        },
        {
            "address": "haydensato",
            "message": "This address does not expire.",
            "registration": {
                "message": "This address was registered 6 months and 2 weeks ago.",
                "unix_epoch_time": "1628978677",
                "iso_8601_time": "2021-08-14T22:04:37+00:00",
                "rfc_2822_time": "Sat, 14 Aug 2021 22:04:37 +0000",
                "relative_time": "6 months and 2 weeks ago"
            },
            "expiration": {
                "expired": false,
                "will_expire": false
            }
        }
    ]
}
```

## Account · Retrieve the account name

Get the name associated with the account

Bearer Token GET /account/email/name

#### **Retrieve the account name**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/account/person@example.com/name'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "The name on this account is Example Person.",
        "name": "Example Person"
    }
}
```

## Account · Set the account name

Update the name associated with the account

Bearer Token POST /account/email/name

#### **Set the account name**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/account/person@example.com/name' --data '{"name": "Example"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Your name has been set to Example.",
        "name": "Example"
    }
}
```

## Account · Retrieve active sessions

Get all sessions associated with the account

Bearer Token GET /account/email/sessions

#### **Retrieve active sessions**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/account/person@example.com/sessions'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": [
        {
            "session_id": "6040bebeac42816f5173ecd4821372d4",
            "user_agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Mobile Safari/537.36",
            "created_ip": "10.0.222.41",
            "created_on": "1639341544",
            "expires_on": "1670877544"
        },
        {
            "session_id": "f3aa272bcf6c42d2b78ce096453d8e53",
            "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
            "created_ip": "10.0.222.42",
            "created_on": "1639349084",
            "expires_on": "1670885084"
        }
    ]
}
```

## Account · Remove a session

Delete a session

Bearer Token DELETE /account/email/sessions/session\_id

#### **Remove a session**

```
curl --location --request DELETE --header 'Authorization: Bearer api_key' 'https://api.omg.lol/account/person@example.com/sessions/8138f2c3e845d5a094ec2a5b2ac0ab04'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, we’ve deleted that session."
    }
}
```

## Account · Retrieve account settings

Get settings associated with the account

Bearer Token GET /account/email/settings

#### **Retrieve account settings**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/account/person@example.com/settings'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here are the settings for this account.",
        "settings": {
            "owner": "person@example.com",
            "communication": "email_ok",
            "date_format": null,
            "web_editor": null
        }
    }
}
```

## Account · Set account settings

Update settings associated with the account

Bearer Token POST /account/email/settings

#### **Set account settings**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/account/person@example.com/settings' --data '{"communication": "email_ok", "web_editor": "advanced"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, your settings have been updated."
    }
}
```

## Address

Obtain information about and make changes to addresses

## Address · Retrieve address availability

Get information about the availability of an address

No Auth GET /address/address/availability

#### **Address is available**

```
curl --location --request GET 'https://api.omg.lol/address/available-address/availability'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "This address is available.",
        "address": "available-address",
        "available": true,
        "availability": "available"
    }
}
```

#### **Address is available but requires encoding**

```
curl --location --request GET 'https://api.omg.lol/address/🥰/availability'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "This address is available, but it must be encoded in Punycode (as xn--js9h).",
        "punycode": "xn--js9h",
        "see-also": [
            "https://www.omg.lol/info/addresses",
            "https://datatracker.ietf.org/doc/html/rfc3492"
        ],
        "address": "🥰",
        "available": true,
        "availability": "available"
    }
}
```

#### **Address is not available**

```
curl --location --request GET 'https://api.omg.lol/address/penelope/availability'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "This address is not available.",
        "address": "penelope",
        "available": false,
        "availability": "unavailable"
    }
}
```

## Address · Retrieve address expiration

Get the expiration date for an address

No Auth GET /address/address/expiration

#### **Address is not near expiration**

```
curl --location --request GET 'https://api.omg.lol/address/foobar/expiration'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "This address is not near expiration.",
        "expired": false
    }
}
```

#### **Address expires within the next six months**

```
curl --location --request GET 'https://api.omg.lol/address/prami/expiration'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "This address expires within the next six months.",
        "expired": false
    }
}
```

#### **Address has expired**

```
curl --location --request GET 'https://api.omg.lol/address/expired-address/expiration'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "This address expired 3 weeks and 4 days ago.",
        "expired": true
    }
}
```

## Address · Retrieve public information about an address

Get limited (public) information about an address when the request is not authenticated

No Auth GET /address/address/info

#### **Retrieve public information about an address**

```
curl --location --request GET 'https://api.omg.lol/address/foobar/info'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "address": "foobar",
        "message": "This address was registered 4 years and 4 months ago.",
        "registration": {
            "message": "This address was registered 4 years, 4 months and 3 weeks ago.",
            "unix_epoch_time": 1554448408,
            "iso_8601_time": "2019-04-05T07:13:28+00:00",
            "rfc_2822_time": "Fri, 05 Apr 2019 07:13:28 +0000",
            "relative_time": "4 years, 4 months and 3 weeks ago"
        },
        "expiration": {
            "message": "This address is not near expiration.",
            "expired": false
        },
        "verification": {
            "message": "This address has been verified.",
            "verified": true
        }
    }
}
```

#### **Retrieve public information about an expired address**

```
curl --location --request GET 'https://api.omg.lol/address/expired-address/info'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "address": "expired-address",
        "message": "This address was registered 1 year and 3 weeks ago.",
        "registration": {
            "message": "This address was registered 1 year, 3 weeks and 4 days ago.",
            "unix_epoch_time": 1659647768,
            "iso_8601_time": "2022-08-04T21:16:08+00:00",
            "rfc_2822_time": "Thu, 04 Aug 2022 21:16:08 +0000",
            "relative_time": "1 year, 3 weeks and 4 days ago"
        },
        "expiration": {
            "message": "This address expired 3 weeks and 4 days ago.",
            "expired": true,
            "unix_epoch_time": 1691183768,
            "iso_8601_time": "2023-08-04T21:16:08+00:00",
            "rfc_2822_time": "Fri, 04 Aug 2023 21:16:08 +0000",
            "relative_time": "3 weeks, 4 days and 14 hours ago"
        }
    }
}
```

## Address · Retrieve private information about an address

Get comprehensive information about an address when the request is authenticated

Bearer Token GET /address/address/info

#### **Retrieve private information about an address**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/info'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "address": "foobar",
        "message": "This address was registered 3 years and 9 months ago and expires in 14 years, 11 months and 5 days.",
        "registration": {
            "message": "This address was registered 3 years, 9 months and 3 weeks ago.",
            "unix_epoch_time": "1554448408",
            "iso_8601_time": "2019-04-05T07:13:28+00:00",
            "rfc_2822_time": "Fri, 05 Apr 2019 07:13:28 +0000",
            "relative_time": "3 years, 9 months and 3 weeks ago"
        },
        "expiration": {
            "message": "This address expires in 14 years, 11 months and 5 days.",
            "expired": false,
            "will_expire": true,
            "unix_epoch_time": "2145916800",
            "iso_8601_time": "2038-01-01T00:00:00+00:00",
            "rfc_2822_time": "Fri, 01 Jan 2038 00:00:00 +0000",
            "relative_time": "14 years, 11 months and 5 days"
        },
        "verification": {
            "message": "This address has been verified.",
            "verified": true
        },
        "owner": "634b9e7a7fbce"
    }
}
```

## DNS

Requests for managing DNS.

## DNS · Retrieve DNS records for an address

Get a list of all of your DNS records.

Bearer Token GET /address/address/dns

#### **Retrieve DNS records for an address**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/dns'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here are the DNS records for foobar.",
        "dns": [
            {
                "id": "2857074",
                "type": "A",
                "name": "foobar",
                "data": "192.167.0.1",
                "priority": null,
                "ttl": "3600",
                "created_at": "2022-11-26T04:30:13Z",
                "updated_at": "2022-11-26T04:31:33Z"
            },
            {
                "id": "2857075",
                "type": "CNAME",
                "name": "cname.foobar",
                "data": "elsewhere.tld",
                "priority": null,
                "ttl": "3600",
                "created_at": "2022-11-26T04:34:24Z",
                "updated_at": "2022-11-26T04:34:24Z"
            }
        ]
    }
}
```

## DNS · Create a new DNS record

Add a new DNS record.

Bearer Token POST /address/address/dns

#### **Create a new DNS record**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/dns' --data '{"type": "CNAME", "name": "cname", "data": "elsewhere.tld"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Your DNS record was created successfully.",
        "data_sent": {
            "type": "A",
            "priority": null,
            "ttl": null,
            "name": "foobar",
            "content": "10.0.0.1"
        },
        "response_received": {
            "data": {
                "id": 2857074,
                "name": "foobar",
                "content": "10.0.0.1",
                "ttl": 3600,
                "priority": null,
                "type": "A",
                "created_at": "2022-11-26T04:30:13Z",
                "updated_at": "2022-11-26T04:30:13Z"
            }
        }
    }
}
```

## DNS · Edit an existing DNS record

Update an existing DNS record.

Bearer Token PATCH /address/address/dns/id

#### **Edit an existing DNS record**

```
curl --location --request PATCH --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/dns/2857074' --data '{"type": "A", "name": "@", "data": "192.167.0.1"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Your DNS record was updated successfully.",
        "data_sent": {
            "type": "A",
            "priority": null,
            "ttl": null,
            "name": "foobar",
            "content": "192.167.0.1"
        },
        "response_received": {
            "data": {
                "id": 2857074,
                "name": "foobar",
                "content": "192.167.0.1",
                "ttl": 3600,
                "priority": null,
                "type": "A",
                "created_at": "2022-11-26T04:30:13Z",
                "updated_at": "2022-11-26T04:31:33Z"
            }
        }
    }
}
```

## DNS · Delete a DNS record

Delete a DNS record.

Bearer Token DELETE /address/address/dns/id

#### **Delete a DNS record**

```
curl --location --request DELETE --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/dns/2857073'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, your DNS record has been deleted."
    }
}
```

## Directory

Retrieve the address directory, consisting of addresses that have opted in to be listed

## Directory · Retrieve the address directory

Retrieve the address directory

No Auth GET /directory

#### **Retrieve the address directory**

```
curl --location --request GET 'https://api.omg.lol/directory'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here’s the omg.lol directory.",
        "url": "https://home.omg.lol/directory",
        "directory": [
            "0",
            "adam",
            ...
        ]
    }
}
```

## Email

Manage the email configuration for omg.lol addresses

## Email · Retrieve forwarding address(es)

Retrieve forwarding address(es)

Bearer Token GET /address/address/email/

#### **List forwarding email address(es)**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/adam/email/'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Mail for haydensato@omg.lol will be forwarded to **someone@example.com**.",
        "destination_string": "someone@example.com",
        "destination_array": [
            "someone@example.com"
        ],
        "address": "haydensato",
        "email_address": "haydensato@omg.lol"
    }
}
```

## Email · Set forwarding address(es)

Set forwarding address(es)

Bearer Token POST /address/address/email/

#### **Set a forwarding email address**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/adam/email/' --data '{"destination": "adam@neatnik.net, test@neatnik.net, test@neatnik.net"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Mail for haydensato@omg.lol will be forwarded to **person@example.com**.",
        "destination_string": "person@example.com",
        "destination_array": [
            "person@example.com"
        ],
        "address": "haydensato",
        "email_address": "haydensato@omg.lol"
    }
}
```

#### **Set multiple forwarding addresses**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/adam/email/' --data '{"destination": "adam@neatnik.net, test@neatnik.net, test@neatnik.net"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Mail for haydensato@omg.lol will be forwarded to **person@example.com**, **another_person@example.com**, and **yet_another_person@example.com**.",
        "destination_string": "person@example.com, another_person@example.com, yet_another_person@example.com",
        "destination_array": [
            "person@example.com",
            "another_person@example.com",
            "yet_another_person@example.com"
        ],
        "address": "haydensato",
        "email_address": "haydensato@omg.lol"
    }
}
```

#### **Clear a forwarding address**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/adam/email/' --data '{"destination": "adam@neatnik.net, test@neatnik.net, test@neatnik.net"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Mail for haydensato@omg.lol will not be forwarded.",
        "destination_string": null,
        "destination_array": [],
        "address": "haydensato",
        "email_address": "haydensato@omg.lol"
    }
}
```

## Now Page

Manage your /now page.

## Now Page · Retrieve /now Page

Retrieve the now page for an address.

No Auth GET /address/address/now

#### **Retrieve /now Page**

```
curl --location --request GET 'https://api.omg.lol/address/foobar/now'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here’s the Now Page for @foobar.",
        "now": {
            "content": "/* This is a sample /now page — edit it and make it your own! */\r\n\r\n{profile-picture}\r\n\r\n# {address} // you can change this to your name!\r\n\r\n## My /now page\r\n\r\n--- Now ---\r\n\r\n(This is a [now page](https://nownownow.com/about), and if you have your own site, [you should make one](https://nownownow.com/about), too.)\r\n\r\n### What I’m reading\r\n\r\n- [Wuthering Heights](https://en.wikipedia.org/wiki/Wuthering_Heights) by [Emily Brontë ](https://en.wikipedia.org/wiki/Emily_Brontë) {book}\r\n- [Monocole](https://monocle.com) {book}\r\n\r\n### What I’m watching\r\n\r\n- [The Jeffersons](https://en.wikipedia.org/wiki/The_Jeffersons) {display}\r\n- [Coronation Street](https://en.wikipedia.org/wiki/Coronation_Street) {display}\r\n\r\n### What I’m making\r\n\r\n- [Sourdough bread](https://www.feastingathome.com/sourdough-bread/) {bread-slice}\r\n- [Socks](https://www.yarnspirations.com/bernat-family-knit-work-socks/BRK0328-001994M.html?cgid=patterns) {socks}\r\n\r\n### What I’m enjoying\r\n\r\n- Time with friends and family {people-roof}\r\n- Planning for my upcoming trip {plane}\r\n\r\n---\r\n\r\n{last-updated}\r\n\r\n[Back to my omg.lol page!](https://{address}.omg.lol)",
            "updated": "1674364245",
            "listed": "1"
        }
    }
}
```

## Now Page · Retrieve the now.garden listing

Retrieve all listed /now pages.

No Auth GET /now/garden

#### **Retrieve the now.garden listing**

```
curl --location --request GET 'https://api.omg.lol/now/garden'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here are all of the /now pages in the Now Garden.",
        "garden": [
            {
                "address": "drudge",
                "url": "https://penree.com/now",
                "updated": {
                    "unix_epoch_time": "1673929294",
                    "iso_8601_time": "2023-01-17T04:21:34+00:00",
                    "rfc_2822_time": "Tue, 17 Jan 2023 04:21:34 +0000",
                    "relative_time": "22 minutes and 41 seconds ago"
                }
            },
            ...
        ]
    }
}
```

## Now Page · Update /now Page

Update the contents of a /now page.

Bearer Token POST /address/address/now

#### **Update /now Page**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/now' --data '{"content": "/* This is a sample /now page — edit it and make it your own! */\r\n\r\n{profile-picture}\r\n\r\n# {address} // you can change this to your name!\r\n\r\n## My /now page\r\n\r\n--- Now ---\r\n\r\n(This is a [now page](https://nownownow.com/about), and if you have your own site, [you should make one](https://nownownow.com/about), too.)\r\n\r\n### What I’m reading\r\n\r\n- [Wuthering Heights](https://en.wikipedia.org/wiki/Wuthering_Heights) by [Emily Brontë ](https://en.wikipedia.org/wiki/Emily_Brontë) {book}\r\n- [Monocole](https://monocle.com) {book}\r\n\r\n### What I’m watching\r\n\r\n- [The Jeffersons](https://en.wikipedia.org/wiki/The_Jeffersons) {display}\r\n- [Coronation Street](https://en.wikipedia.org/wiki/Coronation_Street) {display}\r\n\r\n### What I’m making\r\n\r\n- [Sourdough bread](https://www.feastingathome.com/sourdough-bread/) {bread-slice}\r\n- [Socks](https://www.yarnspirations.com/bernat-family-knit-work-socks/BRK0328-001994M.html?cgid=patterns) {socks}\r\n\r\n### What I’m enjoying\r\n\r\n- Time with friends and family {people-roof}\r\n- Planning for my upcoming trip {plane}\r\n\r\n---\r\n\r\n{last-updated}\r\n\r\n[Back to my omg.lol page!](https://{address}.omg.lol)",
"listed": "1"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, your /now page has been updated."
    }
}
```

## OAuth

Endpoints related to omg.lol’s OAuth 2.0 flows

## OAuth · Exchange an authorization code for an access token

Take the authorization code provided during the OAuth flow and exchange it for an access token.

Bearer Token GET /oauth/

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/oauth/?client_id=ea14dafd3e92cbcf93750c35cd81a031&client_secret=ec28b8653f1d98b4eef3f7a20858c43b&redirect_uri=https://example.com/&code=f5f07426f08277983eb4010c6a2b10ac&scope=everything'
```

```
{
    "access_token": "b3086f894a176a3a7e702decd9b97bbc",
    "token_type": "Bearer",
    "scope": "everything"
}
```

## PURLs

Manage the PURLs (or Persistent URLs) for an omg.lol address

## PURLs · Create a new PURL

Create a new PURL

Bearer Token POST /address/address/purl

#### **Create a new PURL**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foo/purl' --data '{"name": "example-purl", "url": "https://example.com", "listed": true}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, your PURL has been saved.",
        "name": "example",
        "url": "https://example.com"
    }
}
```

## PURLs · Retrieve a specific PURL

Retrieve a specific PURL

Bearer Token GET /address/address/purl/example

#### **Retrieve a specific PURL**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foo/purl/example'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here’s the PURL you requested.",
        "purl": {
            "name": "example",
            "url": "https://example.com",
            "counter": null
        }
    }
}
```

## PURLs · Retrieve a list of PURLs for an address

Retrieve a list of PURLs associated with an address

Bearer Token GET /address/address/purls

#### **Retrieve a list of PURLs for an address**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foo/purls'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here are the PURLs for foo.",
        "purls": [
            {
                "name": "awesome",
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "counter": "872"
            },
            {
                "name": "💚",
                "url": "https://example.com",
                "counter": "33"
            }
        ]
    }
}
```

## PURLs · Delete a PURL

Permanently delete a PURL

Bearer Token DELETE /address/address/purl/purl

#### **Delete a PURL**

```
curl --location --request DELETE --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/purl/example'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, that PURL has been deleted."
    }
}
```

## Pastebin

Manage the Pastebin for an omg.lol address

## Pastebin · Retrieve a specific paste

Retrieve a specific paste

No Auth GET /address/address/pastebin/paste

#### **Retrieve a specific paste**

```
curl --location --request GET 'https://api.omg.lol/address/adam/pastebin/api'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here’s the paste at adam.paste.lol/api.",
        "paste": {
            "title": "api",
            "content": "This paste, like all others, can be fully managed with the omg.lol API.",
            "modified_on": "1656569579"
        }
    }
}
```

## Pastebin · Retrieve an entire Pastebin

Retrieve an entire Pastebin

Bearer Token GET /address/address/pastebin

#### **Retrieve an entire pastebin**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/adam/pastebin'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here’s the pastebin for adam.",
        "pastebin": [
            {
                "title": "api",
                "content": "This paste, like all others, can be fully managed with the omg.lol API.",
                "modified_on": "1656569579"
            },
            {
                "title": "hello-world",
                "content": "^_^",
                "modified_on": "1656569562"
            }
        ]
    }
}
```

## Pastebin · Retrieve listed pastes in a Pastebin

Retrieve listed pastes in a Pastebin

No Auth GET /address/address/pastebin

#### **Retrieve listed pastes in a pastebin**

```
curl --location --request GET 'https://api.omg.lol/address/adam/pastebin'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here are the listed pastes for adam.",
        "pastebin": [
            {
                "title": "hello-world",
                "content": "yo world, sup",
                "modified_on": "1656897567"
            },
            {
                "title": "api",
                "content": "This paste, like all others, can be fully managed with the omg.lol API.",
                "modified_on": "1656569579"
            }
        ]
    }
}
```

## Pastebin · Create or update a paste in a Pastebin

Create or update a paste in a Pastebin

Bearer Token POST /address/address/pastebin/

#### **Create or update a paste in a pastebin**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/adam/pastebin/' --data '{"title": "new-paste", "content": "This is a new paste."}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, your paste has been saved.",
        "title": "new-paste"
    }
}
```

## Pastebin · Delete a paste from a Pastebin

Delete a paste from a Pastebin

Bearer Token DELETE /address/address/pastebin/paste

#### **Delete a paste from a pastebin**

```
curl --location --request DELETE --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/adam/pastebin/delete-me'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, that paste has been deleted."
    }
}
```

## Preferences

Manage preferences for omg.lol accounts, addresses, and objects

## Preferences · Save an individual preference

Save a single preference

Bearer Token POST /preferences/owner

#### **Save an individual preference**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/preferences/foo' --data '{"item": "foo", "value": "bar"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Your preference has been saved.",
        "item": "foo",
        "value": "bar"
    }
}
```

## Service

Obtain service information about omg.lol

## Service · Retrieve service information and statistics

Get information and statistics about the omg.lol service

No Auth GET /service/info

#### **Retrieve service information and statistics**

```
curl --location --request GET 'https://api.omg.lol/service/info'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "As of 2022-10-05T03:13:14+00:00, omg.lol has 1,811 members and hosts 1,685 active addresses. Of those, 888 have active profiles or web pages.",
        "members": 1811,
        "addresses": 1685,
        "profiles": 888
    }
}
```

## Statuslog

Manage the Statuslog for an omg.lol address

## Statuslog · Retrieve an individual status for an address

Fetch a single Statuslog entry

No Auth GET /address/address/statuses/status

#### **Retrieve an individual status for an address**

```
curl --location --request GET 'https://api.omg.lol/address/foo/statuses/6336318079242'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here’s the status at foo.status.lol/6336318079242.",
        "status": {
            "id": "6336318079242",
            "address": "foo",
            "created": "1664496000",
            "emoji": "☕️",
            "content": "Enjoying my coffee!"
        }
    }
}
```

## Statuslog · Retrieve all statuses for an address

Fetch someone’s entire Statuslog

No Auth GET /address/address/statuses/

#### **Retrieve all statuses**

```
curl --location --request GET 'https://api.omg.lol/address/adam/statuses/'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here are foo’s statuses.",
        "statuses": [
            {
                "id": "6335ec5bee31a",
                "address": "foo",
                "created": "1664478299",
                "emoji": "😄",
                "content": "I’m doing great!"
            },
            {
                "id": "6334d1c11917a",
                "address": "foo",
                "created": "1664405953",
                "emoji": "☕️",
                "content": "Enjoying my coffee."
            }
        ]
    }
}
```

## Statuslog · Share a new status

Create a new status in an address’s Statuslog

Bearer Token POST /address/address/statuses/

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/statuses/' --data '{"emoji": "🧪", "content": "Testing the omg.lol API!", "external_url": "mailto:foobar@omg.lol", "skip_mastodon_post": true}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, your status has been saved. [View it live.](https://status.lol/foobar/63d40f2b35314)",
        "id": "63d40f2b35314",
        "status": "🧪 Testing the omg.lol API!",
        "url": "https://status.lol/foobar/63d40f2b35314",
        "external_url": "mailto:foobar@omg.lol"
    }
}
```

## Statuslog · Share a new status from a single status string

Create a new status in an address’s Statuslog

Bearer Token POST /address/address/statuses/

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/statuses/' --data '{"status": "🧪 Testing the omg.lol API!", "external_url": "https://example.com"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, your status has been saved. [View it live.](https://status.lol/foobar/63d40f5db114b)",
        "id": "63d40f5db114b",
        "status": "✨ 🧪 Testing the omg.lol API!",
        "url": "https://status.lol/foobar/63d40f5db114b",
        "external_url": "https://example.com"
    }
}
```

## Statuslog · Update an existing status

Update a status in an address’s Statuslog

Bearer Token PATCH /address/address/statuses/

#### **Update an existing status**

```
curl --location --request PATCH --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/adam/statuses/' --data '{"id": "6336204d247e4", "emoji": "😄", "content": "I’m doing fine!"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, your status has been saved. [View it live.](https://status.lol/foo/6336204d247e4)",
        "id": "6336204d247e4",
        "url": "https://status.lol/foo/6336204d247e4"
    }
}
```

## Statuslog · Retrieve a Statuslog bio

Retrieve a Statuslog bio

No Auth GET /address/address/statuses/bio/

#### **Retrieve a statuslog bio**

```
curl --location --request GET 'https://api.omg.lol/address/adam/statuses/bio'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here’s the bio for foo’s Statuslog page.",
        "bio": "# Foo\nThis is my bio!",
        "css": ""
    }
}
```

## Statuslog · Update a Statuslog bio

Update a Statuslog bio

Bearer Token POST /address/address/statuses/bio/

#### **Update a statuslog bio**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/adam/statuses/bio' --data '{"content": "# Foo\nThis is my bio!"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, the bio on foo.status.lol has been saved. [View it live.](https://status.lol/foo)",
        "url": "https://status.lol/foo"
    }
}
```

## Statuslog · Retrieve the entire statuslog

Fetch someone’s entire Statuslog

No Auth GET /statuslog

#### **Retrieve the entire statuslog**

```
curl --location --request GET 'https://api.omg.lol/statuslog'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here’s the complete statuslog.",
        "statuses": [
            {
                "id": "6391416a125e8",
                "address": "dm",
                "created": "1670463850",
                "relative_time": "28 minutes ago",
                "emoji": "☺",
                "content": "Streamed a discussion on HRD's YouTube channel"
            },
            {
                "id": "63913d4127ad9",
                "address": "skoobz",
                "created": "1670462785",
                "relative_time": "45 minutes ago",
                "emoji": "📺",
                "content": "Watching Ink Master"
            },
            ...
        ]
    }
}
```

## Statuslog · Retrieve everyone’s latest status

Fetch someone’s entire Statuslog

No Auth GET /statuslog/latest

#### **Retrieve everyone’s latest status**

```
curl --location --request GET 'https://api.omg.lol/statuslog/latest'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here are everyone’s latest statuses.",
        "statuses": [
            {
                "id": "638ff5cfaa031",
                "address": "cm",
                "created": "1670378959",
                "relative_time": "1 day ago",
                "emoji": "🤔",
                "content": "Excited about omg.lol!"
            },
            {
                "id": "638ff59bd1be8",
                "address": "moe",
                "created": "1670378907",
                "relative_time": "1 day ago",
                "emoji": "👀",
                "content": "Browsing [omg.lol - Statuslog](https://home.omg.lol/address/moe/statuslog)."
            },
            ...
        ]
    }
}
```

## Theme

Work with omg.lol profile page themes

## Theme · Retrieve a list of profile themes

Get a list of available omg.lol profile themes

No Auth GET /theme/list

#### **Retrieve a list of profile themes**

```
curl --location --request GET 'https://api.omg.lol/theme/list'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "There are 15 profile themes available.",
        "themes": {
            "default": {
                "id": "default",
                "name": "Default",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "omg.lol",
                "author_url": "https://omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "A friendly, simple look for your amazing profile.",
                "preview_css": "{\r\n\t\"background_css\": \"background: linear-gradient(0deg, #3fb6b6 0%, #d56b86 100%) !important; background-repeat: no-repeat; background-attachment: fixed;\",\r\n\t\"text_css\": \"color: #000;\",\r\n\t\"link_css\": \"color: #000;\",\r\n\t\"icon_css\": \"color: #000;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "cherry-blossom": {
                "id": "cherry-blossom",
                "name": "Cherry Blossom",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "omg.lol",
                "author_url": "https://omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "Springtime, but all year long.",
                "preview_css": "{\r\n\t\"background_css\": \"background: #ffb7c5 !important;\",\r\n\t\"text_css\": \"color: #000;\",\r\n\t\"link_css\": \"color: #333;\",\r\n\t\"icon_css\": \"color: #b53c54;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "dark": {
                "id": "dark",
                "name": "Dark",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "omg.lol",
                "author_url": "https://omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "It’s super dark!",
                "preview_css": "{\r\n\t\"background_css\": \"background: #222 !important;\",\r\n\t\"text_css\": \"color: #ccc;\",\r\n\t\"link_css\": \"color: #ccc;\",\r\n\t\"icon_css\": \"color: #ccc;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "dracula": {
                "id": "dracula",
                "name": "Dracula",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "Bye",
                "author_url": "https://bye.omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "Dark theme with a touch of purple. Adapted from the Dracula color scheme by @zenorocha",
                "preview_css": "{\r\n\t\"background_css\": \"background: #44475a !important;\",\r\n\t\"text_css\": \"color: #f8f8f2;\",\r\n\t\"link_css\": \"color: #f8f8f2;\",\r\n\t\"icon_css\": \"color: #f8f8f2;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "gilded": {
                "id": "gilded",
                "name": "Gilded",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "Nima Owji",
                "author_url": "https://nima.omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "Bold and dark with a touch of gold.",
                "preview_css": "{\r\n\t\"background_css\": \"background: #212121 !important;\",\r\n\t\"text_css\": \"color: #fff;\",\r\n\t\"link_css\": \"color: #fff;\",\r\n\t\"icon_css\": \"color: #fabc02;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "gradient": {
                "id": "gradient",
                "name": "Gradient",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "Jamie Thalacker",
                "author_url": "https://jamiethalacker.dev",
                "version": "1.0",
                "license": "MIT",
                "description": "A nice theme with an animated, gradient background.",
                "preview_css": "{\r\n\t\"background_css\": \"background: linear-gradient(313deg,#fecaca,#fde68a,#a7f3d0,#bfdbfe,#c7d2fe,#ddd6fe,#fbcfe8) !important; background-size: 1400% 1400%;\",\r\n\t\"text_css\": \"color: #000;\",\r\n\t\"link_css\": \"color: #000;\",\r\n\t\"icon_css\": \"color: #000;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "hacker": {
                "id": "hacker",
                "name": "Hacker",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "Matse Van Horebeek",
                "author_url": "https://matsevh.omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "Look like a hacker!",
                "preview_css": "{\r\n\t\"background_css\": \"background: rgb(5, 5, 5); !important;\",\r\n\t\"text_css\": \"color: #0daf00;\",\r\n\t\"link_css\": \"color: #0daf00;\",\r\n\t\"icon_css\": \"color: #0daf00;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "minimal": {
                "id": "minimal",
                "name": "Minimal",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "Jane Manchun Wong",
                "author_url": "https://jane.omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "A minimal theme with automatic light/dark mode detection.",
                "preview_css": "{\r\n\t\"background_css\": \"background: #FAFAFA !important;\",\r\n\t\"text_css\": \"color: #202020;\",\r\n\t\"link_css\": \"color: #202020;\",\r\n\t\"icon_css\": \"color: #202020;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "monokai": {
                "id": "monokai",
                "name": "Monokai",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "Dakota Chambers",
                "author_url": "https://dakota.omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "Your text editor's favorite color palette. Adapted from the Monokai color scheme by Wimer Hazenberg (@monokai).",
                "preview_css": "{\r\n\t\"background_css\": \"background: #363537; !important;\",\r\n\t\"text_css\": \"color: #F7F1FF;\",\r\n\t\"link_css\": \"color: #F7F1FF;\",\r\n\t\"icon_css\": \"color: #FA638D;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "naked": {
                "id": "naked",
                "name": "Naked",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "omg.lol",
                "author_url": "https://omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "No style at all, for those who want to do their own thing!",
                "preview_css": "{\r\n\t\"background_css\": \"background: #fff !important; font-family: serif;\",\r\n\t\"text_css\": \"color: #000;\",\r\n\t\"link_css\": \"color: blue;\",\r\n\t\"icon_css\": \"display: none; color: #000;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "nord-dark": {
                "id": "nord-dark",
                "name": "Nord (Dark)",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "Jason E. Kratz (@jasonekratz)",
                "author_url": "https://jasonekratz.omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "Dark theme based on the Nord color palette. See: https://www.nordtheme.com/docs/colors-and-palettes CSS based on Dakota Chambers' Monokai theme.",
                "preview_css": "{\r\n\t\"background_css\": \"background: ##2E3440 !important;\",\r\n\t\"text_css\": \"color: #d8dee9;\",\r\n\t\"link_css\": \"color: #5e81ac;\",\r\n\t\"icon_css\": \"color: #bf616a;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "omglol-special": {
                "id": "omglol-special",
                "name": "omg.lol Special",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "Ediz Baha",
                "author_url": "https://ediz.omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "omg.lol Special - This theme is inspired by the new design of the omg.lol site.",
                "preview_css": "{\r\n\t\"background_css\": \"background: #343A40 !important; border: 1px solid #868e96 !important;\",\r\n\t\"text_css\": \"color: #F1F3F5;\",\r\n\t\"link_css\": \"color: #F1F3F5;\",\r\n\t\"icon_css\": \"color: #F783AC;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "purplegray": {
                "id": "purplegray",
                "name": "PurpleGray",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "Mert Dogu",
                "author_url": "https://mert.omg.lol",
                "version": "1.0",
                "license": "MIT",
                "description": "Purple.. and yeah, gray.",
                "preview_css": "{\r\n\t\"background_css\": \"background: #ac80ff !important;\",\r\n\t\"text_css\": \"color: #363636;\",\r\n\t\"link_css\": \"color: #3f3f3f;\",\r\n\t\"icon_css\": \"color: #2b2b2bb6;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "toasted-minimal": {
                "id": "toasted-minimal",
                "name": "Toasted Minimal",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "Laker J.V Turner",
                "author_url": "https://laker.tech",
                "version": "1.0",
                "license": "MIT",
                "description": "It's essentially Cosmic Latte, as an OMG.LOL theme!",
                "preview_css": "{\r\n\t\"background_css\": \"background: #FFF8E7 !important;\",\r\n\t\"text_css\": \"color: #000;\",\r\n\t\"link_css\": \"color: #000;\",\r\n\t\"icon_css\": \"color: #000;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            },
            "sun-kissed": {
                "id": "sun-kissed",
                "name": "Sun Kissed",
                "created": "1660967179",
                "updated": "1660967179",
                "author": "Catnatsuki",
                "author_url": "https://twitter.com/catnatsuki_",
                "version": "1.0",
                "license": "MIT",
                "description": "A theme which will remind you of a calm and beautiful sunrise.",
                "preview_css": "{\r\n\t\"background_css\": \"background: #fde3b3 !important;\",\r\n\t\"text_css\": \"color: #1F1B15;\",\r\n\t\"link_css\": \"color: #725a42;\",\r\n\t\"icon_css\": \"color: #f39519;\"\r\n}",
                "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
            }
        }
    }
}
```

## Theme · Retrieve information about a theme

Get information about a specific theme

No Auth GET /theme/theme/info

#### **Retrieve information about a theme**

```
curl --location --request GET 'https://api.omg.lol/theme/default/info'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "theme": {
            "id": "default",
            "name": "Default",
            "created": "1660967179",
            "updated": "1660967179",
            "author": "omg.lol",
            "author_url": "https://omg.lol",
            "version": "1.0",
            "license": "MIT",
            "description": "A friendly, simple look for your amazing profile.",
            "preview_css": "{\r\n\t\"background_css\": \"background: linear-gradient(0deg, #3fb6b6 0%, #d56b86 100%) !important; background-repeat: no-repeat; background-attachment: fixed;\",\r\n\t\"text_css\": \"color: #000;\",\r\n\t\"link_css\": \"color: #000;\",\r\n\t\"icon_css\": \"color: #000;\"\r\n}",
            "sample_profile": "{profile-picture}\r\n\r\n# Hayden Sato\r\n\r\n| Pronouns: she/her\r\n| Occupation: Arborist\r\n| Location: Fiji\r\n\r\n--- Bio ---\r\n\r\nI take care of trees!\r\n\r\n--- Profile Items ---\r\n\r\n- https://instagram.com/haydensato\r\n- https://twitter.com/haydensato\r\n- https://facebook.com/haydensato"
        }
    }
}
```

## Theme · Retrieve a theme preview

Get an HTML preview of a theme

No Auth GET /theme/theme/preview

#### **Retrieve a theme preview**

```
curl --location --request GET 'https://api.omg.lol/theme/default/preview'
```

```
{"response":{"message":"Here\u2019s an HTML preview of the Default theme.","html":"
<!DOCTYPE html>\n
<html lang=\"en\">\n  
    <head>\n    
        <title>\n      Hayden Sato\n    <\/title>\n    
            <meta charset=\"utf-8\">\n    
            <meta property=\"og:type\" content=\"website\">\n    
            <meta property=\"og:title\" content=\"Hayden Sato\">\n    
            <meta property=\"og:description\" content=\"\">\n    
            <meta property=\"og:image\" content=\"\">\n    
            <meta name=\"viewport\" content=\"width=device-width\">\n    
            <link href=\"https:\/\/static.omg.lol\/profiles\/themes\/css\/base.css?v=20220807\" rel=\"stylesheet\">\n  <\/head>\n  
            <body>\n    
                <main>\n      
                    <h1 id=\"name\">\n        Hayden Sato 
                        <a id=\"verification\" title=\"This address is verified.\" style=\"text-decoration: none; border: 0;\" href=\"https:\/\/home.omg.lol\/info\/profile-verification\">
                            <i class=\"fa-solid fa-badge-check\"><\/i><\/a>\n      <\/h1>\n      
                                <div class=\"metadata\" id=\"pronouns\">\n        she\/her\n      <\/div>\n      
                                    <div class=\"metadata\" id=\"occupation\">\n        
                                        <i class=\"fa-solid fa-briefcase\"><\/i> Arborist\n      <\/div>\n      
                                            <div class=\"metadata\" id=\"location\">\n        
                                                <i class=\"fa-solid fa-location-dot\"><\/i> Fiji\n      <\/div>\n      
                                                    <div id=\"details\"><\/div>\n      
                                                        <div id=\"bio\">\n        
                                                            <p>\n          I take care of trees!\n        <\/p>\n      <\/div>\n      
                                                                <div id=\"profile-items\">\n        
                                                                    <ul class=\"fa-ul\">\n          
                                                                        <li>\n            
                                                                            <span class=\"fa-li\">
                                                                                <i class=\"fa-brands fa-instagram\"><\/i><\/span>
                                                                                    <a rel=\"me\" href=\"https:\/\/instagram.com\/haydensato\">haydensato<\/a>\n          <\/li>\n          
                                                                                        <li>\n            
                                                                                            <span class=\"fa-li\">
                                                                                                <i class=\"fa-brands fa-twitter\"><\/i><\/span>
                                                                                                    <a rel=\"me\" href=\"https:\/\/twitter.com\/haydensato\">haydensato<\/a>\n          <\/li>\n          
                                                                                                        <li>\n            
                                                                                                            <span class=\"fa-li\">
                                                                                                                <i class=\"fa-brands fa-facebook\"><\/i><\/span>
                                                                                                                    <a rel=\"me\" href=\"https:\/\/facebook.com\/haydensato\">haydensato<\/a>\n          <\/li>\n        <\/ul>\n      <\/div>\n      
                                                                                                                        <div id=\"footer\">\n        
                                                                                                                            <a href=\"https:\/\/home.omg.lol\/\">
                                                                                                                                <span class=\"logotype\">omg
                                                                                                                                    <span class=\"logotype\" style=\"color: #f06595;\">.<\/span>lol<\/span>
                                                                                                                                        <br>\n        
                                                                                                                                        <svg viewbox=\"0 0 500 500\" xmlns=\"http:\/\/www.w3.org\/2000\/svg\" id=\"prami\">\n        
                                                                                                                                            <g transform=\"matrix(1.886789, 0, 0, -1.886789, -351.413971, 1414.84082)\" style>\n          
                                                                                                                                                <g id=\"g24\" transform=\"matrix(1, 0, 0, 1, 318.75, 511.366486)\">\n            
                                                                                                                                                    <path d=\"m 0,0 c -20.346,0 -40.691,7.762 -56.215,23.285 l -53,53 c -31.047,31.047 -31.047,81.383 0,112.43 29.997,29.997 78,31.012 109.215,3.044 31.216,27.967 79.219,26.952 109.215,-3.044 31.047,-31.047 31.047,-81.383 0,-112.43 l -53,-53 C 40.692,7.762 20.346,0 0,0\" style=\"fill:#ff69ad;fill-opacity:1;fill-rule:nonzero;stroke:none\" id=\"path26\"><\/path>\n          <\/g>\n          
                                                                                                                                                        <g id=\"g28\" transform=\"matrix(1, 0, 0, 1, 303.125, 656.25)\">\n            
                                                                                                                                                            <path d=\"m 0,0 c 0,-3.452 -2.798,-6.25 -6.25,-6.25 -3.452,0 -6.25,2.798 -6.25,6.25 0,3.452 2.798,6.25 6.25,6.25 C -2.798,6.25 0,3.452 0,0\" style=\"fill:#461036;fill-opacity:1;fill-rule:nonzero;stroke:none\" id=\"path30\"><\/path>\n          <\/g>\n          
                                                                                                                                                                <g id=\"g32\" transform=\"matrix(1, 0, 0, 1, 303.125, 656.25)\">\n            
                                                                                                                                                                    <path d=\"m 0,0 c 0,-3.452 -2.798,-6.25 -6.25,-6.25 -3.452,0 -6.25,2.798 -6.25,6.25 0,3.452 2.798,6.25 6.25,6.25 C -2.798,6.25 0,3.452 0,0 Z\" style=\"fill:none;stroke:#461036;stroke-width:6;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1\" id=\"path34\"><\/path>\n          <\/g>\n          
                                                                                                                                                                        <g id=\"g36\" transform=\"matrix(1, 0, 0, 1, 346.875, 656.25)\">\n            
                                                                                                                                                                            <path d=\"m 0,0 c 0,-3.452 -2.798,-6.25 -6.25,-6.25 -3.452,0 -6.25,2.798 -6.25,6.25 0,3.452 2.798,6.25 6.25,6.25 C -2.798,6.25 0,3.452 0,0\" style=\"fill:#461036;fill-opacity:1;fill-rule:nonzero;stroke:none\" id=\"path38\"><\/path>\n          <\/g>\n          
                                                                                                                                                                                <g id=\"g40\" transform=\"matrix(1, 0, 0, 1, 346.875, 656.25)\">\n            
                                                                                                                                                                                    <path d=\"m 0,0 c 0,-3.452 -2.798,-6.25 -6.25,-6.25 -3.452,0 -6.25,2.798 -6.25,6.25 0,3.452 2.798,6.25 6.25,6.25 C -2.798,6.25 0,3.452 0,0 Z\" style=\"fill:none;stroke:#461036;stroke-width:6;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1\" id=\"path42\"><\/path>\n          <\/g>\n          
                                                                                                                                                                                        <g id=\"g44\" transform=\"matrix(1, 0, 0, 1, 296.88681, 631.243286)\">\n            
                                                                                                                                                                                            <path d=\"M 0,0 C 10.004,-16.325 33.722,-16.325 43.726,0\" style=\"fill:none;stroke:#461036;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1\" id=\"path46\"><\/path>\n          <\/g>\n          
                                                                                                                                                                                                <g id=\"g48\" transform=\"matrix(1, 0, 0, 1, 418.75, 637.5)\">\n            
                                                                                                                                                                                                    <path d=\"M 0,0 C 0,17.259 -13.991,31.25 -31.25,31.25 -48.509,31.25 -62.5,17.259 -62.5,0 c 0,-17.259 13.991,-31.25 31.25,-31.25 C -13.991,-31.25 0,-17.259 0,0\" style=\"fill:#e34198;fill-opacity:1;fill-rule:nonzero;stroke:none\" id=\"path50\"><\/path>\n          <\/g>\n          
                                                                                                                                                                                                        <g id=\"g52\" transform=\"matrix(1, 0, 0, 1, 281.25, 637.5)\">\n            
                                                                                                                                                                                                            <path d=\"M 0,0 C 0,17.259 -13.991,31.25 -31.25,31.25 -48.509,31.25 -62.5,17.259 -62.5,0 c 0,-17.259 13.991,-31.25 31.25,-31.25 C -13.991,-31.25 0,-17.259 0,0\" style=\"fill:#e34198;fill-opacity:1;fill-rule:nonzero;stroke:none\" id=\"path54\"><\/path>\n          <\/g>\n          
                                                                                                                                                                                                                <g id=\"g56\" transform=\"matrix(1, 0, 0, 1, 296.88681, 631.243286)\">\n            
                                                                                                                                                                                                                    <path d=\"M 0,0 C 10.004,-16.325 33.722,-16.325 43.726,0\" style=\"fill:none;stroke:#461036;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1\" id=\"path58\"><\/path>\n          <\/g>\n        <\/g><\/svg><\/a>\n      <\/div>\n    <\/main>\n  <\/body>\n<\/html>"}}
```

## Web

Manage profile page and web stuff on an omg.lol address

## Web · Retrieve web page content

Retrieve web content and information for an address

Bearer Token GET /address/address/web

#### **Retrieve web page content**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/web'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here is the web content for foobar.",
        "content": "{profile-picture}\r\n\r\n# Foo Bar\r\n\r\n| Pronouns: they/them\r\n| Occupation: [Crop Trust](https://www.croptrust.org) \r\n| Location: Svalbard\r\n\r\n--- Bio ---\r\n\r\nOne thing about me is I once spilled coffee on a production server.\r\n\r\n--- Profile Items ---\r\n\r\n- [Twitter](https://twitter.com)\r\n- [Instagram](https://instagram.com)\r\n- [Mastodon](https://social.lol)\r\n- [Buy Me a Coffee](https://buymeacoffee.com) <small>(just don’t tell the server)</small>\r\n- https://geotastic.net/foobar\r\n",
        "type": "profile",
        "theme": "default",
        "css": "",
        "head": "",
        "verified": "1",
        "pfp": "foobar.jpg",
        "metadata": "{\"title\":\"\",\"description\":\"\"}",
        "branding": "default"
    }
}
```

## Web · Update web page content and publish

Update web content for an address

Bearer Token POST /address/address/web

#### **Update web page content and publish**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/haydensato/web' --data '{"publish": true, "content": "{profile-picture}\r\n\r\n# Foo Bar\r\n\r\n| Pronouns: they/them\r\n| Occupation: [Crop Trust](https://www.croptrust.org) \r\n| Location: Svalbard\r\n\r\n--- Bio ---\r\n\r\nOne thing about me is I once spilled coffee on a production server.\r\n\r\n--- Profile Items ---\r\n\r\n- [Twitter](https://twitter.com)\r\n- [Instagram](https://instagram.com)\r\n- [Mastodon](https://social.lol)\r\n- [Buy Me a Coffee](https://buymeacoffee.com) (just don’t tell the server)\r\n- https://geotastic.net/foobar\r\n"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Your web content has been saved and published."
    }
}
```

## Web · Update web page content without publishing

Update web content for an address

Bearer Token POST /address/address/web

#### **Update web page content without publishing**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/haydensato/web' --data '{"content": "{profile-picture}\r\n\r\n# Foo Bar\r\n\r\n| Pronouns: they/them\r\n| Occupation: [Crop Trust](https://www.croptrust.org) \r\n| Location: Svalbard\r\n\r\n--- Bio ---\r\n\r\nOne thing about me is I once spilled coffee on a production server.\r\n\r\n--- Profile Items ---\r\n\r\n- [Twitter](https://twitter.com)\r\n- [Instagram](https://instagram.com)\r\n- [Mastodon](https://social.lol)\r\n- [Buy Me a Coffee](https://buymeacoffee.com) (just don’t tell the server)\r\n- https://geotastic.net/foobar\r\n"}'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Your web content has been saved."
    }
}
```

## Web · Upload a profile picture

Upload (or replace) a profile picture / avatar.

Bearer Token POST /address/address/pfp

#### **Upload a profile picture**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/adam/pfp'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "We received 2891341 bytes of data."
    }
}
```

## Weblog

Endpoints for managing your weblog.

## Weblog · Retrieve weblog entries

Retrieve all of your weblog entries.

Bearer Token GET /address/address/weblog/entries

#### **Retrieve weblog entries**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/weblog/entries'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here are your weblog entries.",
        "entries": [
            {
                "address": "foobar",
                "location": "/2022/12/my-weblog-post",
                "title": "My weblog post",
                "date": "1670615520",
                "type": "post",
                "status": "live",
                "source": "---\nDate: 2022-12-09 19:52\n---\n\n# My weblog post\n\nThis is a new blog post. You can author it in _Markdown_, which is **awesome**.",
                "body": "# My weblog post\n\nThis is a new blog post. You can author it in _Markdown_, which is **awesome**.",
                "output": "<h1>My weblog post</h1>\n<p>This is a new blog post. You can author it in <em>Markdown</em>, which is <strong>awesome</strong>.</p>",
                "metadata": "{\"date\":\"2022-12-09 19:52\",\"slug\":\"my-weblog-post\"}",
                "entry": "63aa3df342ba2"
            },
            {
                "address": "foobar",
                "location": "/2022/12/test-post",
                "title": "Test post",
                "date": "1670795160",
                "type": "post",
                "status": "live",
                "source": "Date: 2022-12-11 5:46 PM EDT\n\n# Test post\n\nThis is a test.",
                "body": "# Test post\n\nThis is a test.",
                "output": "<h1>Test post</h1>\n<p>This is a test.</p>",
                "metadata": "{\"date\":\"2022-12-11 5:46 PM EDT\",\"slug\":\"test-post\"}",
                "entry": "abc123"
            }
        ]
    }
}
```

## Weblog · Create a new weblog entry

Create a new weblog entry.

Bearer Token POST /address/address/weblog/entry/entry

#### **Create a new weblog entry**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/weblog/entry/abc123' --data 'Date: 2022-12-11 5:46 PM EDT

# Test post

This is a test.'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Your entry has been saved.",
        "entry": {
            "location": "/2022/12/test-post",
            "title": "Test post",
            "date": 1670795160,
            "type": "post",
            "status": "live",
            "body": "# Test post\n\nThis is a test.",
            "source": "Date: 2022-12-11 5:46 PM EDT\n\n# Test post\n\nThis is a test.",
            "metadata": {
                "date": "2022-12-11 5:46 PM EDT",
                "slug": "test-post"
            },
            "output": "<h1>Test post</h1>\n<p>This is a test.</p>",
            "entry": "abc123"
        }
    }
}
```

## Weblog · Retrieve a weblog entry

Retrieve a single weblog entry.

Bearer Token GET /address/address/weblog/entry/entry

#### **Retrieve a weblog entry**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/weblog/entry/63aa3df342ba2'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here is your weblog entry.",
        "entry": {
            "address": "foobar",
            "location": "/2022/12/my-weblog-post",
            "title": "My weblog post",
            "date": "1670615520",
            "type": "post",
            "status": "live",
            "source": "---\nDate: 2022-12-09 19:52\n---\n\n# My weblog post\n\nThis is a new blog post. You can author it in _Markdown_, which is **awesome**.",
            "body": "# My weblog post\n\nThis is a new blog post. You can author it in _Markdown_, which is **awesome**.",
            "output": "<h1>My weblog post</h1>\n<p>This is a new blog post. You can author it in <em>Markdown</em>, which is <strong>awesome</strong>.</p>",
            "metadata": "{\"date\":\"2022-12-09 19:52\",\"slug\":\"my-weblog-post\"}",
            "entry": "63aa3df342ba2",
            "id": "fh3dyct1fhaurm5pxrszq3mnptzsqmmop73ze"
        }
    }
}
```

## Weblog · Retrieve the latest weblog post

Retrieve the latest post from a weblog.

No Auth GET /address/address/weblog/post/latest

#### **Retrieve the latest weblog post**

```
curl --location --request GET 'https://api.omg.lol/address/foobar/weblog/post/latest'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here is the latest post.",
        "post": {
            "address": "foobar",
            "location": "/2022/12/test-post",
            "title": "Test post",
            "date": "1670795160",
            "type": "post",
            "status": "live",
            "source": "Date: 2022-12-11 5:46 PM EDT\n\n# Test post\n\nThis is a test.",
            "body": "# Test post\n\nThis is a test.",
            "output": "<h1>Test post</h1>\n<p>This is a test.</p>",
            "metadata": "{\"date\":\"2022-12-11 5:46 PM EDT\",\"slug\":\"test-post\"}",
            "entry": "abc123"
        }
    }
}
```

## Weblog · Delete a weblog entry

Permanently delete a weblog entry.

Bearer Token DELETE /address/address/weblog/delete/entry

#### **Delete a weblog entry**

```
curl --location --request DELETE --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/weblog/delete/63961b11b0a7d'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "OK, your weblog post was deleted."
    }
}
```

## Weblog · Retrieve weblog configuration

Retrieve your weblog configuration.

Bearer Token GET /address/address/weblog/configuration

#### **Retrieve weblog configuration**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/weblog/configuration'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here is your weblog configuration.",
        "configuration": {
            "object": {
                "weblog-title": "A Weblog",
                "weblog-description": "This is a weblog.",
                "author": "Your Name",
                "separator": " · ",
                "tag-path": "/tag/",
                "timezone": "UTC",
                "date-format": "F j, Y g:i A",
                "default-post": "---\nDate: $date\n---\n\n# Your new post\n\nThis is a new blog post. You can author it in _Markdown_, which is **awesome**.",
                "feed-post-count": "25",
                "post-path-format": "/Y/m/",
                "recent-posts-count": "5",
                "recent-posts-format": "\n<ul>\n[post:begin]<li><a href=\"$location\">$title</a></li>[post:end]\n</ul>",
                "post-list-format": "\n<ul>\n[post:begin]<li><a href=\"$location\">$title</a></li>[post:end]\n</ul>",
                "search-status": "enabled",
                "search-results-success-message": "There [is|are] $count [result|results] for your search:",
                "search-results-failure-message": "There were no results found for your search.",
                "search-results-format": "\n<h2>Results for “$search”</h2>\n<p>$search_results_message</p>\n[post:begin]<h3><a href=\"$location\">$title</a></h3>\n<p>$date</p>\n<p>$snippet</p>[post:end]\n"
            },
            "json": "{\n    \"weblog-title\": \"A Weblog\",\n    \"weblog-description\": \"This is a weblog.\",\n    \"author\": \"Your Name\",\n    \"separator\": \" \\u00b7 \",\n    \"tag-path\": \"\\/tag\\/\",\n    \"timezone\": \"UTC\",\n    \"date-format\": \"F j, Y g:i A\",\n    \"default-post\": \"---\\nDate: $date\\n---\\n\\n# Your new post\\n\\nThis is a new blog post. You can author it in _Markdown_, which is **awesome**.\",\n    \"feed-post-count\": \"25\",\n    \"post-path-format\": \"\\/Y\\/m\\/\",\n    \"recent-posts-count\": \"5\",\n    \"recent-posts-format\": \"\\n<ul>\\n[post:begin]<li><a href=\\\"$location\\\">$title<\\/a><\\/li>[post:end]\\n<\\/ul>\",\n    \"post-list-format\": \"\\n<ul>\\n[post:begin]<li><a href=\\\"$location\\\">$title<\\/a><\\/li>[post:end]\\n<\\/ul>\",\n    \"search-status\": \"enabled\",\n    \"search-results-success-message\": \"There [is|are] $count [result|results] for your search:\",\n    \"search-results-failure-message\": \"There were no results found for your search.\",\n    \"search-results-format\": \"\\n<h2>Results for \\u201c$search\\u201d<\\/h2>\\n<p>$search_results_message<\\/p>\\n[post:begin]<h3><a href=\\\"$location\\\">$title<\\/a><\\/h3>\\n<p>$date<\\/p>\\n<p>$snippet<\\/p>[post:end]\\n\"\n}",
            "raw": "// Weblog Configuration\n\n# About your weblog\n\nWeblog Title: A Weblog\nWeblog Description: This is a weblog.\nAuthor: Your Name\n\n# General config stuff\n\nSeparator:  · \n// Navigation: about, another-page, <a href=\"https://example.com\">Example</a>, [Example](https://example.com)\nTag path: /tag/\n\n# Time stuff\n\n; You can use a timezone value from the \"TZ database name\" column on this \n; web page: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones\n\nTimezone: UTC\nDate format: F j, Y g:i A\n\n# Posts\n\n// Post path format: /Y/m/\n\nDefault post: <<[---\nDate: $date\n---\n\n# Your new post\n\nThis is a new blog post. You can author it in _Markdown_, which is **awesome**.]>>\n"
        }
    }
}
```

## Weblog · Update weblog configuration

Update your weblog configuration.

Bearer Token POST /address/address/weblog/configuration

#### **Update weblog configuration**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/weblog/configuration' --data '// Weblog Configuration

# About your weblog

Weblog Title: A Weblog
Weblog Description: This is a weblog.
Author: Your Name

Landing page: home

# General config stuff

Separator:  · 
// Navigation: about, another-page, Example, [Example](https://example.com)
Tag path: /tag/

# Time stuff

; You can use a timezone value from the "TZ database name" column on this 
; web page: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

Timezone: UTC
Date format: F j, Y g:i A

# Posts

Post path format: /Y/m/
Default post: <<[---
Date: $date
---

# Your new post

This is a new blog post. You can author it in _Markdown_, which is **awesome**.]>>

Navigation: home, another-page
# Navigation: home, [Profile](https://profile.omg.lol/rb/), 2022/12/apple-post, another-page
'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Your weblog configuration has been updated."
    }
}
```

## Weblog · Retrieve weblog template

Retrieve your weblog template.

Bearer Token GET /address/address/weblog/template

#### **Retrieve weblog template**

```
curl --location --request GET --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/weblog/template'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Here is your weblog template.",
        "template": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<title>{weblog-title}{separator}{post-title}</title>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n{feeds}\n<style>\n@import url('https://static.omg.lol/type/font-honey.css');\n@import url('https://static.omg.lol/type/font-lato-regular.css');\n@import url('https://static.omg.lol/type/font-lato-bold.css');\n@import url('https://static.omg.lol/type/font-lato-italic.css');\n@import url('https://static.omg.lol/type/font-md-io.css');\n@import url('https://static.omg.lol/type/fontawesome-free/css/all.css');\n\n:root {\n\t--foreground: #212529;\n\t--background: #f8f9fa;\n\t--link: #0b7285;\n\t--accent: #868e96;\n}\n\n@media (prefers-color-scheme: dark) {\n\t:root {\n\t\t--foreground: #eee;\n\t\t--background: #222;\n\t\t--link: #99e9f2;\n\t\t--accent: #ced4da;\n\t}\n}\n\n* {\n\tbox-sizing: border-box;\n}\n\nbody {\n\tfont-family: 'Lato', sans-serif;\n\tfont-size: 120%;\n\tcolor: var(--foreground);\n\tbackground: var(--background);\n}\n\nheader nav ul {\n\tlist-style-type: none;\n\tmargin: 0;\n\tpadding: 0;\n}\n\nheader nav li {\n\tdisplay: inline-block;\n}\n\nheader nav li a {\n\tdisplay: block;\n\ttext-decoration: none;\n\tmargin-right: 1em;\n}\n\nh1, h2, h3, h4, h5, h6 {\n\tfont-family: 'VC Honey Deck', serif;\n\tmargin: 1rem 0;\n}\n\np, li {\n\tline-height: 160%;\n}\n\nheader, main, footer {\n\tmax-width: 60em;\n\tmargin: 2em auto;\n\tpadding: 0 1em;\n}\n\nheader {\n\tmargin-top: 4em;\n}\n\nfooter p {\n\tmargin-top: 5em;\n\tfont-size: 90%;\n\ttext-align: center;\n}\n\na:link { color: var(--link); }\na:visited { color: var(--link); }\na:hover { color: var(--link); }\na:active { color: var(--link); }\n\n.post-info, .post-tags {\n\tfont-size: 85%;\n\tcolor: var(--accent);\n\ttext-align: right;\n}\n\n.post-info i:nth-child(2) {\n\tmargin-left: .75em;\n}\n\n.tag {\n\tbackground: var(--accent);\n\tcolor: var(--background) !important;\n\tpadding: .3em .4em;\n\tmargin: .8em 0 0 .4em;\n\tborder-radius: .5em;\n\ttext-decoration: none;\n\tdisplay: inline-block;\n}\n\nhr {\n\tborder: 0;\n\theight: 1px;\n\tbackground: #333;\n\tmargin: 2em 0;\n}\n\ncode {\n\tpadding: .2em .3em;\n\tborder: 1px solid var(--accent);\n\twhite-space: pre-wrap;\n\tword-wrap: break-word; \n}\n\npre, code {\n\tfont-family: 'MD IO 0.4';\n\tfont-size: 90%;\n}\n\npre code {\n\tbackground:  #000;\n\tcolor:  #eee;\n\tdisplay: inline-block;\n\tpadding: 1em;\n\twhite-space: pre-wrap;\n\tword-wrap: break-word;   \n}\n\nimg {\n\tmax-width: 100%;\n}\n\ntable {\n\tborder-collapse: collapse;\n}\n\ntd, th {\n\tpadding: .75em;\n\ttext-align: left;\n\tborder: 1px solid var(--accent);\n}\n\t\n.weblog-title a {\n\ttext-decoration: none;\n\tcolor: var(--foreground);\n}\n\n</style>\n</head>\n<body>\n\n<header>\n\t<h1 class=\"weblog-title\"><a href=\"/\">{weblog-title}</a></h1>\n\t{navigation}\n</header>\n\n<main>\n\n<article>\n\t{body}\n\t<aside class=\"post-info\">\n\t\t<i class=\"fa-solid fa-clock\"></i> {date}\n\t</aside>\n\t<aside class=\"post-tags\">\n\t\t{tags}\n\t</aside>\n</article>\n\n<hr>\n\n<h2>Recent posts</h2>\n\n{recent-posts}\n\n</main>\n\n<footer>\n\t<p>Made with <a href=\"https://weblog.lol\">weblog.lol</a>.</p>\n</footer>\n\n</body>\n</html>\n"
    }
}
```

## Weblog · Update weblog template

Update your weblog template.

Bearer Token POST /address/address/weblog/template

#### **Update weblog template**

```
curl --location --request POST --header 'Authorization: Bearer api_key' 'https://api.omg.lol/address/foobar/weblog/template' --data '


{weblog-title}{separator}{post-title}


{feeds}

@import url('https://static.omg.lol/type/font-honey.css');
@import url('https://static.omg.lol/type/font-lato-regular.css');
@import url('https://static.omg.lol/type/font-lato-bold.css');
@import url('https://static.omg.lol/type/font-lato-italic.css');
@import url('https://static.omg.lol/type/font-md-io.css');
@import url('https://static.omg.lol/type/fontawesome-free/css/all.css');

:root {
--foreground: #212529;
--background: #f8f9fa;
--link: #0b7285;
--accent: #868e96;
}

@media (prefers-color-scheme: dark) {
:root {
--foreground: #eee;
--background: #222;
--link: #99e9f2;
--accent: #ced4da;
}
}

* {
box-sizing: border-box;
}

body {
font-family: 'Lato', sans-serif;
font-size: 120%;
color: var(--foreground);
background: var(--background);
}

header nav ul {
list-style-type: none;
margin: 0;
padding: 0;
}

header nav li {
display: inline-block;
}

header nav li a {
display: block;
text-decoration: none;
margin-right: 1em;
}

h1, h2, h3, h4, h5, h6 {
font-family: 'VC Honey Deck', serif;
margin: 1rem 0;
}

p, li {
line-height: 160%;
}

header, main, footer {
max-width: 60em;
margin: 2em auto;
padding: 0 1em;
}

header {
margin-top: 4em;
}

footer p {
margin-top: 5em;
font-size: 90%;
text-align: center;
}

a:link { color: var(--link); }
a:visited { color: var(--link); }
a:hover { color: var(--link); }
a:active { color: var(--link); }

.post-info, .post-tags {
font-size: 85%;
color: var(--accent);
text-align: right;
}

.post-info i:nth-child(2) {
margin-left: .75em;
}

.tag {
background: var(--accent);
color: var(--background) !important;
padding: .3em .4em;
margin: .8em 0 0 .4em;
border-radius: .5em;
text-decoration: none;
display: inline-block;
}

hr {
border: 0;
height: 1px;
background: #333;
margin: 2em 0;
}

code {
padding: .2em .3em;
border: 1px solid var(--accent);
white-space: pre-wrap;
word-wrap: break-word; 
}

pre, code {
font-family: 'MD IO 0.4';
font-size: 90%;
}

pre code {
background:  #000;
color:  #eee;
display: inline-block;
padding: 1em;
white-space: pre-wrap;
word-wrap: break-word;   
}

img {
max-width: 100%;
}

table {
border-collapse: collapse;
}

td, th {
padding: .75em;
text-align: left;
border: 1px solid var(--accent);
}

.weblog-title a {
text-decoration: none;
color: var(--foreground);
}






{weblog-title}
{navigation}





{body}

 {date}


{tags}





Recent posts

{recent-posts}




Made with weblog.lol.




'
```

```
{
    "request": {
        "status_code": 200,
        "success": true
    },
    "response": {
        "message": "Your weblog template has been updated."
    }
}
```
