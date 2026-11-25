"use client";

import { useState } from "react";
import { Chart, useChart } from "@chakra-ui/charts";
import { Box, Flex, SegmentGroup, Text } from "@chakra-ui/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BMI_RANGES, describeBmiRange, type ProgressPoint } from "@imc-calculator/shared";
import { formatDate, formatMonth, formatNumber } from "@/lib/formatters";

type ChartMetric = "bmi" | "weight";

const Y_AXIS_PADDING = 2;
const NORMAL_WEIGHT_BMI_RANGE = BMI_RANGES.find(
  (bmiRange) => bmiRange.classification === "normal-weight",
);

const CHART_METRIC_OPTIONS: readonly { value: ChartMetric; label: string }[] = [
  { value: "bmi", label: "IMC" },
  { value: "weight", label: "Peso" },
];

export function ProgressChart({ progressPoints }: { progressPoints: ProgressPoint[] }) {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>("bmi");
  const chart = useChart({
    data: progressPoints.map((progressPoint) => ({
      date: progressPoint.createdAt,
      bmi: progressPoint.bmi,
      weight: progressPoint.weight,
    })),
    series: [
      {
        name: selectedMetric,
        color: "graphite.900",
        label: selectedMetric === "bmi" ? "IMC" : "Peso (kg)",
      },
    ],
  });

  const bmiValues = progressPoints.map((progressPoint) => progressPoint.bmi);
  const normalRangeMin = NORMAL_WEIGHT_BMI_RANGE?.min ?? null;
  const normalRangeMax = NORMAL_WEIGHT_BMI_RANGE?.max ?? null;
  const isNormalRangeVisible =
    selectedMetric === "bmi" &&
    normalRangeMin !== null &&
    normalRangeMax !== null &&
    Math.min(...bmiValues) - Y_AXIS_PADDING < normalRangeMax &&
    Math.max(...bmiValues) + Y_AXIS_PADDING > normalRangeMin;

  if (progressPoints.length < 2) {
    return (
      <Flex
        h="56"
        align="center"
        justify="center"
        textAlign="center"
        color="fg.muted"
        fontSize="sm"
        px="6"
      >
        A evolução aparece aqui a partir da segunda avaliação.
      </Flex>
    );
  }

  return (
    <Box>
      <Flex justify="end" mb="3">
        <SegmentGroup.Root
          size="xs"
          value={selectedMetric}
          onValueChange={(event) =>
            setSelectedMetric(
              CHART_METRIC_OPTIONS.find(
                (metricOption) => metricOption.value === event.value,
              )?.value ?? "bmi",
            )
          }
        >
          <SegmentGroup.Indicator bg="brand.solid" />
          <SegmentGroup.Items items={[...CHART_METRIC_OPTIONS]} />
        </SegmentGroup.Root>
      </Flex>
      <Chart.Root h="64" aspectRatio="auto" chart={chart}>
        <LineChart
          responsive
          data={chart.data}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            stroke={chart.color("border")}
            vertical={false}
            strokeDasharray="4 4"
          />
          {isNormalRangeVisible ? (
            <ReferenceArea
              y1={normalRangeMin ?? undefined}
              y2={normalRangeMax ?? undefined}
              fill={chart.color("green.500")}
              fillOpacity={0.08}
              ifOverflow="hidden"
            />
          ) : null}
          <XAxis
            dataKey={chart.key("date")}
            tickFormatter={formatMonth}
            padding={{ left: 16, right: 16 }}
            stroke={chart.color("fg.muted")}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <YAxis
            domain={[`dataMin - ${Y_AXIS_PADDING}`, `dataMax + ${Y_AXIS_PADDING}`]}
            tickFormatter={(tickValue: number) => formatNumber(tickValue, 0)}
            stroke={chart.color("fg.muted")}
            tickLine={false}
            axisLine={false}
            width={36}
            fontSize={12}
          />
          <Tooltip
            cursor={{ stroke: chart.color("border") }}
            animationDuration={100}
            labelFormatter={(pointDate) =>
              typeof pointDate === "string" && !Number.isNaN(Date.parse(pointDate))
                ? formatDate(pointDate)
                : ""
            }
            content={
              <Chart.Tooltip
                formatter={(metricValue) =>
                  formatNumber(Number(metricValue), selectedMetric === "bmi" ? 2 : 1)
                }
              />
            }
          />
          {chart.series.map((chartSeries) => (
            <Line
              key={chartSeries.name}
              type="monotone"
              isAnimationActive={false}
              dataKey={chart.key(chartSeries.name)}
              stroke={chart.color(chartSeries.color)}
              strokeWidth={2.5}
              dot={{
                r: 4,
                fill: chart.color("brand.solid"),
                stroke: chart.color("graphite.900"),
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: chart.color("brand.solid"),
                stroke: chart.color("graphite.900"),
                strokeWidth: 2,
              }}
            />
          ))}
        </LineChart>
      </Chart.Root>
      {isNormalRangeVisible ? (
        <Text mt="2" fontSize="xs" color="fg.muted">
          A faixa verde marca o peso normal (IMC de{" "}
          {NORMAL_WEIGHT_BMI_RANGE ? describeBmiRange(NORMAL_WEIGHT_BMI_RANGE) : ""}).
        </Text>
      ) : null}
    </Box>
  );
}
