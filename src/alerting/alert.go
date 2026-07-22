package alerting

import (
	"context"
	"fmt"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/alerting/discord"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/alerting/sg"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/alerting/sns"
)

// Alert alerts to any of the 3 different alerting methods.
func Alert(ctx context.Context, title, description string) {
	if !gAlertingEnabled {
		return
	}

	sns.PublishToSnsTopic(ctx, fmt.Sprintf("%s\n\n%s", title, description))
	sg.SendMail(ctx, title, description)
	discord.PublishEmbed(ctx, title, description, 0x0)
}
